import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRepository } from '../../src/db/memory.repository.js';
import { ConversationEngine } from '../../src/services/conversation/conversation.engine.js';
import { mockWhatsAppProviderInstance } from '../../src/services/whatsapp/index.js';

describe('Message Deduplication & Opt-Out Compliance', () => {
  let db: MemoryRepository;
  let engine: ConversationEngine;

  beforeEach(() => {
    db = new MemoryRepository();
    engine = new ConversationEngine(db);
    mockWhatsAppProviderInstance.clearLogs();
  });

  it('should ignore duplicate message deliveries with the same meta_message_id', async () => {
    const input = {
      phoneNumberId: 'WHATSAPP_PHONE_ID_EDU_ALT_TECH',
      from: '+15550199010',
      messageId: 'wamid.dedup.12345',
      timestamp: '1700000000',
      type: 'text',
      text: 'Tell me about the bootcamp',
    };

    // First arrival
    const firstResult = await engine.processIncomingMessage(input);
    expect(firstResult.status).toBe('replied_by_ai');
    expect(mockWhatsAppProviderInstance.sentMessages.length).toBe(1);

    // Duplicate arrival (Meta webhook retry)
    const duplicateResult = await engine.processIncomingMessage(input);
    expect(duplicateResult.status).toBe('duplicate_ignored');

    // WhatsApp provider must NOT have sent a duplicate reply
    expect(mockWhatsAppProviderInstance.sentMessages.length).toBe(1);
  });

  it('should handle STOP / opt-out request and mark contact as opted_out', async () => {
    const input = {
      phoneNumberId: 'WHATSAPP_PHONE_ID_SETSUZOKU',
      from: '+15550199020',
      messageId: `wamid.optout.${Date.now()}`,
      timestamp: '1700000001',
      type: 'text',
      text: 'STOP',
    };

    const result = await engine.processIncomingMessage(input);
    expect(result.status).toBe('opt_out');
    expect(result.replyText).toContain('opted out');

    // Verify contact status in DB
    const setsu = (await db.getBusinessBySlug('setsuzoku'))!;
    const contact = (await db.getOrCreateContact(setsu.id, '+15550199020', '+15550199020'))!;
    expect(contact.opt_in_status).toBe('opted_out');
  });
});
