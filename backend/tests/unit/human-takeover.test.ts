import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRepository } from '../../src/db/memory.repository.js';
import { ConversationEngine } from '../../src/services/conversation/conversation.engine.js';
import { HumanHandoffService } from '../../src/services/handoff/human.handoff.service.js';
import { mockWhatsAppProviderInstance } from '../../src/services/whatsapp/index.js';

describe('Human Takeover & Handoff Lifecycle', () => {
  let db: MemoryRepository;
  let engine: ConversationEngine;
  let handoffService: HumanHandoffService;

  beforeEach(() => {
    db = new MemoryRepository();
    engine = new ConversationEngine(db);
    handoffService = new HumanHandoffService(db);
    mockWhatsAppProviderInstance.clearLogs();
  });

  it('should suppress AI replies while human takeover is active', async () => {
    const fromPhone = '+15550199030';
    const edu = (await db.getBusinessBySlug('edu-alt-tech'))!;

    // Initial message establishes conversation
    await engine.processIncomingMessage({
      phoneNumberId: edu.whatsapp_phone_number_id,
      from: fromPhone,
      messageId: 'msg_initial_1',
      timestamp: '1700000002',
      type: 'text',
      text: 'Hello, I have questions',
    });

    const contact = (await db.getOrCreateContact(edu.id, fromPhone, fromPhone))!;
    const conv = (await db.getOrCreateConversation(edu.id, contact.id))!;

    // Human operator takes over
    await handoffService.initiateTakeover(conv.id, 'Customer requested advisor', 'admin_manual', 'agent-123');

    // Verify conversation is paused
    const updatedConv = (await db.getConversationById(conv.id))!;
    expect(updatedConv.status).toBe('paused_human');

    const sentCountBefore = mockWhatsAppProviderInstance.sentMessages.length;

    // Next customer message arrives while paused
    const nextResult = await engine.processIncomingMessage({
      phoneNumberId: edu.whatsapp_phone_number_id,
      from: fromPhone,
      messageId: 'msg_during_takeover_2',
      timestamp: '1700000003',
      type: 'text',
      text: 'Are you there? I need advice on payments',
    });

    expect(nextResult.status).toBe('routed_to_human');
    // Provider count must NOT have increased (AI did NOT reply)
    expect(mockWhatsAppProviderInstance.sentMessages.length).toBe(sentCountBefore);

    // Human operator replies
    await handoffService.sendAgentReply(conv.id, 'Hello! Advisor here, how can I assist you?', 'agent-123');
    expect(mockWhatsAppProviderInstance.sentMessages.length).toBe(sentCountBefore + 1);

    // Human releases takeover back to AI
    await handoffService.releaseTakeover(conv.id, 'agent-123');
    const releasedConv = (await db.getConversationById(conv.id))!;
    expect(releasedConv.status).toBe('active');

    // Customer message after release gets answered by AI again
    const postReleaseResult = await engine.processIncomingMessage({
      phoneNumberId: edu.whatsapp_phone_number_id,
      from: fromPhone,
      messageId: 'msg_post_release_3',
      timestamp: '1700000004',
      type: 'text',
      text: 'Tell me about the student AI bootcamp',
    });

    expect(postReleaseResult.status).toBe('replied_by_ai');
    expect(postReleaseResult.replyText).toContain('Bootcamp');
  });
});
