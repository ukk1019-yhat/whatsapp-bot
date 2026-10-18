import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { env } from '../../src/config/env.js';
import { computeSignature } from '../../src/services/whatsapp/signature.validator.js';

describe('Webhook Verification & HMAC Signature Security', () => {
  const app = createApp();

  describe('GET /api/webhooks/whatsapp (Handshake Challenge)', () => {
    it('should return challenge with 200 OK when verify token matches', async () => {
      const challenge = 'challenge_code_987654';
      const res = await request(app)
        .get('/api/webhooks/whatsapp')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': env.META_VERIFY_TOKEN,
          'hub.challenge': challenge,
        });

      expect(res.status).toBe(200);
      expect(res.text).toBe(challenge);
    });

    it('should return 403 Forbidden when verify token is incorrect', async () => {
      const res = await request(app)
        .get('/api/webhooks/whatsapp')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': 'wrong_token_hacker',
          'hub.challenge': '12345',
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });

    it('should return 403 Forbidden when hub.mode is not subscribe', async () => {
      const res = await request(app)
        .get('/api/webhooks/whatsapp')
        .query({
          'hub.mode': 'unsubscribe',
          'hub.verify_token': env.META_VERIFY_TOKEN,
          'hub.challenge': '12345',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/webhooks/whatsapp (HMAC Signature Validation)', () => {
    const payload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
          changes: [
            {
              field: 'messages',
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '+15550103382',
                  phone_number_id: env.WHATSAPP_PHONE_ID_EDU_ALT_TECH,
                },
                messages: [
                  {
                    from: '+15550199001',
                    id: `wamid.test.${Date.now()}`,
                    timestamp: String(Math.floor(Date.now() / 1000)),
                    type: 'text',
                    text: { body: 'Hello Edu Alt Tech!' },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    it('should accept webhook with valid HMAC-SHA256 signature', async () => {
      const rawBody = Buffer.from(JSON.stringify(payload), 'utf8');
      const signature = computeSignature(rawBody, env.META_APP_SECRET);

      const res = await request(app)
        .post('/api/webhooks/whatsapp')
        .set('Content-Type', 'application/json')
        .set('x-hub-signature-256', signature)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('EVENT_RECEIVED');
    });

    it('should reject webhook with 401 when signature header is missing', async () => {
      const res = await request(app)
        .post('/api/webhooks/whatsapp')
        .set('Content-Type', 'application/json')
        .send(payload);

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Unauthorized');
    });

    it('should reject webhook with 401 when signature is tampered or invalid', async () => {
      const invalidSignature = 'sha256=0000000000000000000000000000000000000000000000000000000000000000';

      const res = await request(app)
        .post('/api/webhooks/whatsapp')
        .set('Content-Type', 'application/json')
        .set('x-hub-signature-256', invalidSignature)
        .send(payload);

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Unauthorized');
    });
  });
});
