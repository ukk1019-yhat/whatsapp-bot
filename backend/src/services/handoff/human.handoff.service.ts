import { IDatabaseRepository } from '../../db/repository.interface.js';
import { logger } from '../../logger/logger.js';
import { Handoff } from '../../types/index.js';
import { getWhatsAppProvider } from '../whatsapp/index.js';

export class HumanHandoffService {
  constructor(private db: IDatabaseRepository) {}

  async initiateTakeover(
    conversationId: string,
    reason: string,
    triggeredBy: Handoff['triggered_by'],
    memberId?: string
  ): Promise<Handoff> {
    const conv = await this.db.getConversationById(conversationId);
    if (!conv) {
      throw new Error(`Conversation not found for ID: ${conversationId}`);
    }

    // Check if handoff is already active
    const active = await this.db.getActiveHandoff(conversationId);
    if (active) {
      return active;
    }

    const handoff = await this.db.createHandoff({
      business_id: conv.business_id,
      conversation_id: conversationId,
      assigned_member_id: memberId,
      status: memberId ? 'active' : 'pending',
      escalation_reason: reason,
      triggered_by: triggeredBy,
    });

    await this.db.createAuditLog({
      business_id: conv.business_id,
      member_id: memberId,
      action: 'HUMAN_TAKEOVER_INITIATED',
      entity_type: 'handoff',
      entity_id: handoff.id,
      details: { conversationId, reason, triggeredBy },
    });

    logger.info(
      { conversationId, businessId: conv.business_id, reason },
      'Human handoff initiated. AI automation paused for conversation.'
    );

    return handoff;
  }

  async sendAgentReply(
    conversationId: string,
    replyText: string,
    memberId: string
  ): Promise<{ messageId: string }> {
    const conv = await this.db.getConversationById(conversationId);
    if (!conv) {
      throw new Error('Conversation not found');
    }

    const business = await this.db.getBusinessById(conv.business_id);
    if (!business) {
      throw new Error('Associated business not found');
    }

    const contact = await this.db.getContactById(conv.contact_id);
    if (!contact) {
      throw new Error('Associated contact not found');
    }

    // Enforce that AI cannot reply while agent is in control
    const handoff = await this.db.getActiveHandoff(conversationId);
    if (!handoff) {
      // Auto-start takeover if not already initiated
      await this.initiateTakeover(
        conversationId,
        'Direct agent message from admin dashboard',
        'admin_manual',
        memberId
      );
    }

    // Send via WhatsApp provider
    const waProvider = getWhatsAppProvider();
    const result = await waProvider.sendTextMessage(business.whatsapp_phone_number_id, {
      to: contact.phone_number,
      text: replyText,
    });

    // Save message record
    await this.db.saveMessage({
      conversation_id: conversationId,
      business_id: conv.business_id,
      meta_message_id: result.messageId,
      sender_type: 'human_agent',
      sender_id: memberId,
      message_type: 'text',
      content: replyText,
      metadata: { sent_by_member_id: memberId },
      delivery_status: 'sent',
    });

    await this.db.touchConversation(conversationId, 'business');

    await this.db.createAuditLog({
      business_id: conv.business_id,
      member_id: memberId,
      action: 'AGENT_REPLY_SENT',
      entity_type: 'conversation',
      entity_id: conversationId,
      details: { textLength: replyText.length, metaMessageId: result.messageId },
    });

    return { messageId: result.messageId };
  }

  async releaseTakeover(conversationId: string, memberId?: string): Promise<boolean> {
    const released = await this.db.releaseHandoff(conversationId, memberId);
    if (released) {
      const conv = await this.db.getConversationById(conversationId);
      if (conv) {
        await this.db.createAuditLog({
          business_id: conv.business_id,
          member_id: memberId,
          action: 'HUMAN_TAKEOVER_RELEASED',
          entity_type: 'conversation',
          entity_id: conversationId,
          details: { releasedBy: memberId },
        });
      }
      logger.info({ conversationId }, 'Human takeover released. AI automation resumed.');
    }
    return released;
  }
}
