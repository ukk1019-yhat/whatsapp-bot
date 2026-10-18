import { Request, Response, Router } from 'express';
import { z } from 'zod';
import { getDbRepository } from '../db/index.js';
import { authenticateJWT, enforceTenantIsolation, requireRoles } from '../middleware/auth.js';

export const businessRouter = Router();

businessRouter.use(authenticateJWT);

// GET /api/businesses
businessRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  const db = getDbRepository();
  const user = req.user!;

  if (user.role === 'super_admin') {
    const all = await db.getAllBusinesses();
    res.status(200).json(all);
    return;
  }

  // Scoped to the user's business
  if (!user.businessId) {
    res.status(200).json([]);
    return;
  }

  const business = await db.getBusinessById(user.businessId);
  res.status(200).json(business ? [business] : []);
});

// GET /api/businesses/:id
businessRouter.get('/:id', enforceTenantIsolation((req) => req.params.id), async (req: Request, res: Response): Promise<void> => {
  const db = getDbRepository();
  const business = await db.getBusinessById(req.params.id);
  if (!business) {
    res.status(404).json({ error: 'Business not found' });
    return;
  }

  const settings = await db.getBusinessSettings(business.id);
  res.status(200).json({ ...business, settings });
});

const updateSettingsSchema = z.object({
  system_prompt: z.string().optional(),
  confidence_threshold: z.number().min(0).max(1).optional(),
  auto_handoff_on_pricing: z.boolean().optional(),
  welcome_message: z.string().optional(),
  fallback_message: z.string().optional(),
  operating_hours: z.any().optional(),
  escalation_contacts: z.array(z.any()).optional(),
});

// PUT /api/businesses/:id/settings
businessRouter.put(
  '/:id/settings',
  requireRoles(['super_admin', 'brand_admin']),
  enforceTenantIsolation((req) => req.params.id),
  async (req: Request, res: Response): Promise<void> => {
    const parsed = updateSettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid settings payload', details: parsed.error.issues });
      return;
    }

    const db = getDbRepository();
    const updated = await db.updateBusinessSettings(req.params.id, parsed.data);
    if (!updated) {
      res.status(404).json({ error: 'Settings not found' });
      return;
    }

    await db.createAuditLog({
      business_id: req.params.id,
      member_id: req.user!.memberId,
      action: 'UPDATE_BUSINESS_SETTINGS',
      entity_type: 'business_settings',
      entity_id: req.params.id,
      details: parsed.data,
    });

    res.status(200).json(updated);
  }
);
