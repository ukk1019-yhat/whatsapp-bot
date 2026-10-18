import bcrypt from 'bcryptjs';
import { Request, Response, Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env.js';
import { getDbRepository } from '../db/index.js';
import { authenticateJWT } from '../middleware/auth.js';
import { AuthTokenPayload } from '../types/index.js';

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Invalid login payload', details: result.error.issues });
    return;
  }

  const { email, password } = result.data;
  const db = getDbRepository();
  const member = await db.getMemberByEmail(email);

  if (!member || !member.is_active) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const isPasswordValid = bcrypt.compareSync(password, member.password_hash);
  if (!isPasswordValid) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const tokenPayload: AuthTokenPayload = {
    memberId: member.id,
    businessId: member.business_id,
    email: member.email,
    role: member.role,
  };

  const token = jwt.sign(tokenPayload, env.ADMIN_AUTH_SECRET, {
    expiresIn: '24h',
  });

  let business = null;
  if (member.business_id) {
    business = await db.getBusinessById(member.business_id);
  }

  res.status(200).json({
    token,
    user: {
      id: member.id,
      email: member.email,
      fullName: member.full_name,
      role: member.role,
      businessId: member.business_id,
      businessName: business?.display_name || null,
    },
  });
});

authRouter.get('/me', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  const db = getDbRepository();
  const member = await db.getMemberById(req.user!.memberId);
  if (!member) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  let business = null;
  if (member.business_id) {
    business = await db.getBusinessById(member.business_id);
  }

  res.status(200).json({
    id: member.id,
    email: member.email,
    fullName: member.full_name,
    role: member.role,
    businessId: member.business_id,
    businessName: business?.display_name || null,
  });
});
