import { Request, Response, Router } from 'express';
import { z } from 'zod';
import { getDbRepository } from '../db/index.js';
import { authenticateJWT, enforceTenantIsolation } from '../middleware/auth.js';
import { HumanHandoffService } from '../services/handoff/human.handoff.service.js';

export const conversationRouter = Router();

conversationRouter.use(authenticateJWT);

// GET /api/conversations
conversationRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  const db = getDbRepository();
  const user = req.user!;
  let businessId = req.query.businessId?.toString();

  if (user.role !== 'super_admin') {
    businessId = user.businessId || undefined;
  }

  const status = req.query.status?.toString();
  const convs = await db.getConversations(businessId, status);

  // Enrich conversations with contact name, phone, and active handoff status
  const enriched = await Promise.all(
    convs.map(async (c) => {
      const contact = await db.getContactById(c.contact_id);
      const activeHandoff = await db.getActiveHandoff(c.id);
      const lastMessages = await db.getConversationMessages(c.id, 1);
      const lastMessage = lastMessages[0] || null;

      return {
        ...c,
        contactName: contact?.name || 'WhatsApp Contact',
        contactPhone: contact?.phone_number || '',
        contactOrg: contact?.organization_or_school,
        isHumanTakeover: c.status === 'paused_human' || Boolean(activeHandoff),
        handoffDetails: activeHandoff,
        lastMessagePreview: lastMessage?.content || '',
      };
    })
  );

  res.status(200).json(enriched);
});

// GET /api/conversations/:id
conversationRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const db = getDbRepository();
  const conv = await db.getConversationById(req.params.id);
  if (!conv) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }

  // Tenant check
  if (req.user!.role !== 'super_admin' && conv.business_id !== req.user!.businessId) {
    res.status(403).json({ error: 'Forbidden: Cannot access conversations from other businesses' });
    return;
  }

  const contact = await db.getContactById(conv.contact_id);
  const activeHandoff = await db.getActiveHandoff(conv.id);

  res.status(200).json({
    ...conv,
    contact,
    activeHandoff,
  });
});

// GET /api/conversations/:id/messages
conversationRouter.get('/:id/messages', async (req: Request, res: Response): Promise<void> => {
  const db = getDbRepository();
  const conv = await db.getConversationById(req.params.id);
  if (!conv) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }

  if (req.user!.role !== 'super_admin' && conv.business_id !== req.user!.businessId) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const limit = req.query.limit ? parseInt(req.query.limit.toString(), 10) : 100;
  const messages = await db.getConversationMessages(conv.id, limit);
  res.status(200).json(messages);
});

const sendAgentReplySchema = z.object({
  text: z.string().min(1, 'Message text is required'),
});

// POST /api/conversations/:id/messages (Live human agent reply)
conversationRouter.post('/:id/messages', async (req: Request, res: Response): Promise<void> => {
  const parsed = sendAgentReplySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid message payload', details: parsed.error.issues });
    return;
  }

  const db = getDbRepository();
  const conv = await db.getConversationById(req.params.id);
  if (!conv) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }

  if (req.user!.role !== 'super_admin' && conv.business_id !== req.user!.businessId) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const handoffService = new HumanHandoffService(db);
  const result = await handoffService.sendAgentReply(conv.id, parsed.data.text, req.user!.memberId);

  res.status(201).json({
    success: true,
    messageId: result.messageId,
  });
});

const handoffSchema = z.object({
  reason: z.string().default('Operator manual takeover from dashboard'),
});

// POST /api/conversations/:id/handoff (Initiate takeover)
conversationRouter.post('/:id/handoff', async (req: Request, res: Response): Promise<void> => {
  const parsed = handoffSchema.safeParse(req.body);
  const db = getDbRepository();
  const conv = await db.getConversationById(req.params.id);
  if (!conv) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }

  if (req.user!.role !== 'super_admin' && conv.business_id !== req.user!.businessId) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const handoffService = new HumanHandoffService(db);
  const handoff = await handoffService.initiateTakeover(
    conv.id,
    parsed.success ? parsed.data.reason : 'Manual operator takeover',
    'admin_manual',
    req.user!.memberId
  );

  res.status(200).json({ success: true, handoff });
});

// POST /api/conversations/:id/release (Release takeover back to AI)
conversationRouter.post('/:id/release', async (req: Request, res: Response): Promise<void> => {
  const db = getDbRepository();
  const conv = await db.getConversationById(req.params.id);
  if (!conv) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }

  if (req.user!.role !== 'super_admin' && conv.business_id !== req.user!.businessId) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const handoffService = new HumanHandoffService(db);
  await handoffService.releaseTakeover(conv.id, req.user!.memberId);

  res.status(200).json({ success: true, message: 'AI automation resumed for conversation' });
});
