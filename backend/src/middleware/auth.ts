import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AuthTokenPayload, UserRole } from '../types/index.js';

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

export function authenticateJWT(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.ADMIN_AUTH_SECRET) as AuthTokenPayload;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}

export function requireRoles(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden: Insufficient privileges for this operation',
        requiredRoles: allowedRoles,
        userRole: req.user.role,
      });
      return;
    }

    next();
  };
}

export function enforceTenantIsolation(businessIdExtractor?: (req: Request) => string | undefined) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Super admin can access all tenants
    if (req.user.role === 'super_admin') {
      next();
      return;
    }

    const requestedBusinessId =
      (businessIdExtractor ? businessIdExtractor(req) : undefined) ||
      req.params.businessId ||
      req.query.businessId?.toString() ||
      req.body?.business_id;

    if (requestedBusinessId && requestedBusinessId !== req.user.businessId) {
      res.status(403).json({
        error: 'Forbidden: Cross-tenant access is strictly prohibited',
        userBusinessId: req.user.businessId,
        requestedBusinessId,
      });
      return;
    }

    next();
  };
}
