import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { env } from '../../src/config/env.js';
import { getDbRepository, resetRepositoryForTesting } from '../../src/db/index.js';
import { computeSignature } from '../../src/services/whatsapp/signature.validator.js';

describe('End-to-End WhatsApp Webhook Flow & Lead Qualification Integration', () => {
  const app = createApp();

  beforeEach(() => {
    resetRepositoryForTesting();
  });

  it('should process Edu Alt Tech student enquiry, reply with verified fee, and capture lead', async () => {
    const customerPhone = '+15550199055';
    const messageId = `wamid.e2e.${Date.now()}`;

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
                contacts: [
                  {
                    profile: { name: 'Dr. John Watson' },
                    wa_id: customerPhone,
                  },
                ],
                messages: [
                  {
                    from: customerPhone,
                    id: messageId,
                    timestamp: String(Math.floor(Date.now() / 1000)),
                    type: 'text',
                    text: {
                      body: 'My name is John Watson from St. Xavier School. I want details on the AI Bootcamp course',
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const rawBody = Buffer.from(JSON.stringify(payload), 'utf8');
    const signature = computeSignature(rawBody, env.META_APP_SECRET);

    // 1. Send webhook
    const res = await request(app)
      .post('/api/webhooks/whatsapp')
      .set('Content-Type', 'application/json')
      .set('x-hub-signature-256', signature)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('EVENT_RECEIVED');

    // Allow async microtask execution to finalize
    await new Promise((r) => setTimeout(r, 100));

    // 2. Verify Database records
    const db = getDbRepository();
    const edu = (await db.getBusinessBySlug('edu-alt-tech'))!;

    // Check contact created
    const contact = (await db.getOrCreateContact(edu.id, customerPhone, customerPhone))!;
    expect(contact).toBeDefined();

    // Check conversation created
    const conv = (await db.getOrCreateConversation(edu.id, contact.id))!;
    expect(conv).toBeDefined();

    // Check messages saved: customer incoming and AI reply
    const messages = await db.getConversationMessages(conv.id);
    expect(messages.length).toBeGreaterThanOrEqual(2);

    const customerMsg = messages.find((m) => m.sender_type === 'customer');
    const aiMsg = messages.find((m) => m.sender_type === 'ai');

    expect(customerMsg).toBeDefined();
    expect(aiMsg).toBeDefined();
    expect(aiMsg?.content).toContain('₹4,999');

    // 3. Check Lead captured in CRM
    const leads = await db.getLeads(edu.id);
    expect(leads.length).toBeGreaterThanOrEqual(1);

    const lead = leads.find((l) => l.contact_id === contact.id);
    expect(lead).toBeDefined();
    expect(lead?.customer_name).toContain('John Watson');
    expect(lead?.organization_or_school).toContain('St. Xavier School');

    // 4. Test Delivery Status Webhook Transition
    const deliveryPayload = {
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
                statuses: [
                  {
                    id: aiMsg!.meta_message_id!,
                    status: 'delivered',
                    timestamp: String(Math.floor(Date.now() / 1000)),
                    recipient_id: customerPhone,
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const deliveryRawBody = Buffer.from(JSON.stringify(deliveryPayload), 'utf8');
    const deliverySig = computeSignature(deliveryRawBody, env.META_APP_SECRET);

    const deliveryRes = await request(app)
      .post('/api/webhooks/whatsapp')
      .set('Content-Type', 'application/json')
      .set('x-hub-signature-256', deliverySig)
      .send(deliveryPayload);

    expect(deliveryRes.status).toBe(200);

    // Verify delivery status updated in DB
    const updatedAiMsg = await db.getMessageByMetaId(aiMsg!.meta_message_id!);
    expect(updatedAiMsg?.delivery_status).toBe('delivered');
  });

  it('should test Setsuzoku enquiry through the interactive simulator endpoint', async () => {
    const simRes = await request(app).post('/api/health/simulator').send({
      businessSlug: 'setsuzoku',
      fromPhone: '+15550199088',
      messageText: 'We need an enterprise AI document processing solution with budget around 20k',
    });

    expect(simRes.status).toBe(200);
    expect(simRes.body.business.slug).toBe('setsuzoku');
    expect(simRes.body.latestReply).toContain('enterprise AI');
    expect(simRes.body.leadsCaptured.length).toBeGreaterThan(0);
    expect(simRes.body.leadsCaptured[0].budget_range).toContain('20k');
  });
});
