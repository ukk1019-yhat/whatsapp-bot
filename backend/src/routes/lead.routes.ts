import { Request, Response, Router } from 'express';
import { z } from 'zod';
import { getDbRepository } from '../db/index.js';
import { authenticateJWT, enforceTenantIsolation } from '../middleware/auth.js';
import { LeadService } from '../services/lead/lead.service.js';
import { LeadStatus } from '../types/index.js';

export const leadRouter = Router();

leadRouter.use(authenticateJWT);

const leadStatusEnum = z.enum([
  'new',
  'contacted',
  'qualified',
  'consultation_requested',
  'proposal_pending',
  'converted',
  'not_interested',
  'closed',
]);

// GET /api/leads
leadRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  const db = getDbRepository();
  const user = req.user!;
  let businessId = req.query.businessId?.toString();

  if (user.role !== 'super_admin') {
    businessId = user.businessId || undefined;
  }

  const status = req.query.status?.toString();
  const leads = await db.getLeads(businessId, status);
  res.status(200).json(leads);
});

// GET /api/leads/export (CSV export)
leadRouter.get('/export', async (req: Request, res: Response): Promise<void> => {
  const db = getDbRepository();
  const user = req.user!;
  let businessId = req.query.businessId?.toString();

  if (user.role !== 'super_admin') {
    businessId = user.businessId || undefined;
  }

  const leads = await db.getLeads(businessId);
  const headers = [
    'Lead ID',
    'Business ID',
    'Customer Name',
    'Phone Number',
    'Organization/School',
    'Category',
    'Requirements',
    'Budget Range',
    'Expected Timeline',
    'Status',
    'Created At',
  ];

  const rows = leads.map((l) => [
    `"${l.id}"`,
    `"${l.business_id}"`,
    `"${(l.customer_name || '').replace(/"/g, '""')}"`,
    `"${l.phone_number}"`,
    `"${(l.organization_or_school || '').replace(/"/g, '""')}"`,
    `"${(l.enquiry_category || '').replace(/"/g, '""')}"`,
    `"${(l.requirements || '').replace(/"/g, '""')}"`,
    `"${(l.budget_range || '').replace(/"/g, '""')}"`,
    `"${(l.expected_timeline || '').replace(/"/g, '""')}"`,
    `"${l.status}"`,
    `"${l.created_at}"`,
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="leads_${businessId || 'all'}_${Date.now()}.csv"`);
  res.status(200).send(csv);
});

// GET /api/leads/:id
leadRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const db = getDbRepository();
  const lead = await db.getLeadById(req.params.id);
  if (!lead) {
    res.status(404).json({ error: 'Lead not found' });
    return;
  }

  if (req.user!.role !== 'super_admin' && lead.business_id !== req.user!.businessId) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  res.status(200).json(lead);
});

const updateLeadSchema = z.object({
  status: leadStatusEnum,
  notes: z.string().optional(),
});

// PATCH /api/leads/:id
leadRouter.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  const parsed = updateLeadSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid lead update payload', details: parsed.error.issues });
    return;
  }

  const db = getDbRepository();
  const lead = await db.getLeadById(req.params.id);
  if (!lead) {
    res.status(404).json({ error: 'Lead not found' });
    return;
  }

  if (req.user!.role !== 'super_admin' && lead.business_id !== req.user!.businessId) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const leadService = new LeadService(db);
  const updated = await leadService.updateLeadStatus(
    lead.id,
    parsed.data.status,
    req.user!.memberId,
    parsed.data.notes
  );

  res.status(200).json(updated);
});
