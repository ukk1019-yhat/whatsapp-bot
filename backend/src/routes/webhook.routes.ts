import { Request, Response, Router } from 'express';
import { env } from '../config/env.js';
import { getDbRepository } from '../db/index.js';
import { logger } from '../logger/logger.js';
import { ConversationEngine } from '../services/conversation/conversation.engine.js';
import { verifyMetaSignature } from '../services/whatsapp/signature.validator.js';
import { MetaWebhookPayload } from '../types/index.js';

export const webhookRouter = Router();

/**
 * GET /api/webhooks/whatsapp
 * Meta WhatsApp Webhook Challenge Verification Handshake
 */
webhookRouter.get('/whatsapp', (req: Request, res: Response): void => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === env.META_VERIFY_TOKEN) {
    logger.info('Meta WhatsApp webhook challenge successfully verified');
    res.status(200).send(challenge);
    return;
  }

  logger.warn({ receivedToken: token }, 'Meta WhatsApp webhook verification failed: Token mismatch');
  res.status(403).json({ error: 'Forbidden: Invalid verification token' });
});

/**
 * POST /api/webhooks/whatsapp
 * Meta WhatsApp Inbound Webhook Event Handler (HMAC-SHA256 signature verified)
 */
webhookRouter.post('/whatsapp', async (req: Request, res: Response): Promise<void> => {
  const signatureHeader = req.headers['x-hub-signature-256'] as string | undefined;
  const rawBody = req.rawBody;

  // 1. Signature Verification
  // In test mode without secret or header, allow test bypass if explicit flag provided
  const isTestBypass = process.env.NODE_ENV === 'test' && req.headers['x-test-bypass-sig'] === 'true';

  if (!isTestBypass) {
    const { isValid, error } = verifyMetaSignature(signatureHeader, rawBody, env.META_APP_SECRET);
    if (!isValid) {
      logger.warn({ error, signatureHeader }, 'Rejected webhook: Invalid HMAC signature');
      res.status(401).json({ error: 'Unauthorized: Invalid signature', message: error });
      return;
    }
  }

  // 2. Acknowledge Meta immediately with 200 OK (Avoid Meta 15-second timeout and retries)
  res.status(200).json({ status: 'EVENT_RECEIVED' });

  // 3. Process events asynchronously
  const payload = req.body as MetaWebhookPayload;
  if (!payload || payload.object !== 'whatsapp_business_account') {
    return;
  }

  const db = getDbRepository();
  const engine = new ConversationEngine(db);

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value;
      if (!value) continue;

      const phoneNumberId = value.metadata?.phone_number_id;

      // Handle Delivery / Read status updates
      if (value.statuses && value.statuses.length > 0) {
        for (const status of value.statuses) {
          try {
            await db.updateMessageDeliveryStatus(
              status.id,
              status.status,
              status.errors?.[0]?.message
            );
            logger.info({ messageId: status.id, status: status.status }, 'Updated WhatsApp message status');
          } catch (err) {
            logger.error({ err, statusId: status.id }, 'Error updating message status');
          }
        }
      }

      // Handle Inbound Customer Messages
      if (value.messages && value.messages.length > 0) {
        for (const msg of value.messages) {
          const eventId = `meta-evt-${msg.id}`;
          try {
            await db.recordWebhookEvent(eventId, null, 'incoming_message', msg as any);

            const text = msg.text?.body;
            const interactiveId = msg.interactive?.button_reply?.id || msg.interactive?.list_reply?.id;

            await engine.processIncomingMessage({
              phoneNumberId: phoneNumberId || 'UNKNOWN_PHONE_ID',
              from: msg.from,
              messageId: msg.id,
              timestamp: msg.timestamp,
              type: msg.type,
              text,
              interactiveSelectionId: interactiveId,
            });

            await db.updateWebhookEventStatus(eventId, 'processed');
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            logger.error({ err, messageId: msg.id }, 'Error processing incoming WhatsApp message');
            await db.updateWebhookEventStatus(eventId, 'failed', errorMsg);
          }
        }
      }
    }
  }
});
