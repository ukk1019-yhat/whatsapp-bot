import { Request, Response, Router } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { getDbRepository } from '../db/index.js';
import { ConversationEngine } from '../services/conversation/conversation.engine.js';
import { mockWhatsAppProviderInstance } from '../services/whatsapp/index.js';

export const healthRouter = Router();

// GET /api/health
healthRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  const db = getDbRepository();
  const businesses = await db.getAllBusinesses();

  const isMetaConfigured =
    env.META_APP_SECRET.length > 5 &&
    !env.META_APP_SECRET.startsWith('your_') &&
    env.WHATSAPP_ACCESS_TOKEN.length > 10;

  const isSupabaseConfigured = Boolean(env.DATABASE_URL || env.SUPABASE_URL);

  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: env.NODE_ENV,
    activeBusinessesCount: businesses.length,
    whatsappIntegration: {
      status: isMetaConfigured ? 'connected' : 'test_mode',
      apiVersion: env.WHATSAPP_API_VERSION,
      webhookVerifyTokenConfigured: Boolean(env.META_VERIFY_TOKEN),
      metaSecretConfigured: isMetaConfigured,
      eduAltTechNumberId: env.WHATSAPP_PHONE_ID_EDU_ALT_TECH,
      setsuzokuNumberId: env.WHATSAPP_PHONE_ID_SETSUZOKU,
    },
    database: {
      provider: isSupabaseConfigured ? 'PostgreSQL' : 'In-Memory Repository',
      status: 'online',
    },
    aiEngine: {
      provider: env.AI_PROVIDER,
      model: env.AI_MODEL,
      groundingEnabled: true,
    },
  });
});

const simulatorSchema = z.object({
  businessSlug: z.enum(['edu-alt-tech', 'setsuzoku']),
  fromPhone: z.string().default('+15550199000'),
  messageText: z.string().min(1, 'messageText is required'),
});

// POST /api/health/simulator
// Direct interactive webhook simulation endpoint for developer testing & admin verification
healthRouter.post('/simulator', async (req: Request, res: Response): Promise<void> => {
  const parsed = simulatorSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid simulation payload', details: parsed.error.issues });
    return;
  }

  const { businessSlug, fromPhone, messageText } = parsed.data;
  const db = getDbRepository();
  const business = await db.getBusinessBySlug(businessSlug);

  if (!business) {
    res.status(404).json({ error: `Business with slug '${businessSlug}' not found` });
    return;
  }

  const engine = new ConversationEngine(db);
  const simMessageId = `sim_msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const result = await engine.processIncomingMessage({
    phoneNumberId: business.whatsapp_phone_number_id,
    from: fromPhone,
    messageId: simMessageId,
    timestamp: String(Math.floor(Date.now() / 1000)),
    type: 'text',
    text: messageText,
  });

  // Fetch updated conversation and contact info
  const contact = await db.getOrCreateContact(business.id, fromPhone, fromPhone);
  const conversation = await db.getOrCreateConversation(business.id, contact.id);
  const messages = await db.getConversationMessages(conversation.id, 10);
  const leads = await db.getLeads(business.id);

  res.status(200).json({
    simulationResult: result,
    business: {
      id: business.id,
      slug: business.slug,
      displayName: business.display_name,
    },
    conversationId: conversation.id,
    conversationStatus: conversation.status,
    messagesCount: messages.length,
    latestReply: result.replyText,
    recentMessages: messages,
    leadsCaptured: leads.filter((l) => l.contact_id === contact.id),
  });
});
