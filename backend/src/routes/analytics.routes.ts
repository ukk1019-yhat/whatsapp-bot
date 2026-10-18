import { Request, Response, Router } from 'express';
import { getDbRepository } from '../db/index.js';
import { authenticateJWT } from '../middleware/auth.js';

export const analyticsRouter = Router();

analyticsRouter.use(authenticateJWT);

// GET /api/analytics/summary
analyticsRouter.get('/summary', async (req: Request, res: Response): Promise<void> => {
  const db = getDbRepository();
  const user = req.user!;
  let businessId = req.query.businessId?.toString();

  if (user.role !== 'super_admin') {
    businessId = user.businessId || undefined;
  }

  const summary = await db.getAnalyticsSummary(businessId);
  res.status(200).json(summary);
});

// GET /api/analytics/audit-logs
analyticsRouter.get('/audit-logs', async (req: Request, res: Response): Promise<void> => {
  const db = getDbRepository();
  const user = req.user!;
  let businessId = req.query.businessId?.toString();

  if (user.role !== 'super_admin') {
    businessId = user.businessId || undefined;
  }

  const limit = req.query.limit ? parseInt(req.query.limit.toString(), 10) : 50;
  const logs = await db.getAuditLogs(businessId, limit);
  res.status(200).json(logs);
});
