import { IDatabaseRepository } from '../../db/repository.interface.js';
import { logger } from '../../logger/logger.js';
import { Conversation, Message } from '../../types/index.js';
import { getAIProvider } from '../ai/index.js';
import { HumanHandoffService } from '../handoff/human.handoff.service.js';
import { LeadService } from '../lead/lead.service.js';
import { BusinessRouter } from '../routing/business.router.js';
import { getWhatsAppProvider } from '../whatsapp/index.js';

export interface ProcessMessageInput {
  phoneNumberId: string;
  from: string;
  messageId: string;
  timestamp: string;
  type: string;
  text?: string;
  interactiveSelectionId?: string;
}

export interface ProcessMessageResult {
  status: 'replied_by_ai' | 'routed_to_human' | 'duplicate_ignored' | 'opt_out' | 'clarification_sent' | 'unhandled';
  conversationId?: string;
  replyText?: string;
  sentMessageId?: string;
}

export class ConversationEngine {
  private router: BusinessRouter;
  private leadService: LeadService;
  private handoffService: HumanHandoffService;

  constructor(private db: IDatabaseRepository) {
    this.router = new BusinessRouter(db);
    this.leadService = new LeadService(db);
    this.handoffService = new HumanHandoffService(db);
  }

  async processIncomingMessage(input: ProcessMessageInput): Promise<ProcessMessageResult> {
    const { phoneNumberId, from, messageId, text, interactiveSelectionId } = input;
    const messageContent = (text || interactiveSelectionId || '').trim();

    logger.info(
      { phoneNumberId, from: from.slice(-4), messageId, type: input.type },
      'Processing incoming WhatsApp message'
    );

    // 1. Deduplication check
    const existingMsg = await this.db.getMessageByMetaId(messageId);
    if (existingMsg) {
      logger.info({ messageId }, 'Duplicate message detected. Skipping redundant processing.');
      return { status: 'duplicate_ignored' };
    }

    // 2. Resolve Business / Brand routing
    const routeResolution = await this.router.resolveBusiness(phoneNumberId, messageContent);
    if (!routeResolution) {
      logger.error({ phoneNumberId }, 'Unable to resolve any business for incoming message');
      return { status: 'unhandled' };
    }

    const { business, requiresClarification, clarificationPrompt } = routeResolution;
    const waProvider = getWhatsAppProvider();

    // 3. Get or create Contact
    const contact = await this.db.getOrCreateContact(business.id, from, from);

    // 4. Opt-Out Handling (STOP / UNSUBSCRIBE)
    const upperContent = messageContent.toUpperCase();
    if (upperContent === 'STOP' || upperContent === 'UNSUBSCRIBE' || upperContent === 'CANCEL') {
      await this.db.updateContact(contact.id, { opt_in_status: 'opted_out' });
      await this.db.createAuditLog({
        business_id: business.id,
        action: 'CONTACT_OPTED_OUT',
        entity_type: 'contact',
        entity_id: contact.id,
        details: { phone: from, trigger: upperContent },
      });

      const optOutReply = `You have been opted out from automated WhatsApp updates from ${business.display_name}. Reply START at any time to resume.`;
      const out = await waProvider.sendTextMessage(phoneNumberId, {
        to: from,
        text: optOutReply,
      });

      return {
        status: 'opt_out',
        replyText: optOutReply,
        sentMessageId: out.messageId,
      };
    }

    // 5. Get or create active Conversation
    const conversation = await this.db.getOrCreateConversation(business.id, contact.id);

    // 6. Persist incoming customer message
    await this.db.saveMessage({
      conversation_id: conversation.id,
      business_id: business.id,
      meta_message_id: messageId,
      sender_type: 'customer',
      sender_id: from,
      message_type: input.type === 'interactive' ? 'interactive' : 'text',
      content: messageContent,
      metadata: { raw_input: input },
      delivery_status: 'received',
    });

    await this.db.touchConversation(conversation.id, 'customer');

    // Mark message as read on WhatsApp
    await waProvider.markMessageAsRead(phoneNumberId, messageId);

    // 7. If routing requires clarification on a shared line
    if (requiresClarification && clarificationPrompt) {
      const out = await waProvider.sendTextMessage(phoneNumberId, {
        to: from,
        text: clarificationPrompt,
      });

      await this.db.saveMessage({
        conversation_id: conversation.id,
        business_id: business.id,
        meta_message_id: out.messageId,
        sender_type: 'ai',
        message_type: 'text',
        content: clarificationPrompt,
        metadata: { is_disambiguation_menu: true },
        delivery_status: 'sent',
      });

      return {
        status: 'clarification_sent',
        conversationId: conversation.id,
        replyText: clarificationPrompt,
        sentMessageId: out.messageId,
      };
    }

    // 8. Human Takeover Check: If AI is paused, do NOT generate automated reply
    const activeHandoff = await this.db.getActiveHandoff(conversation.id);
    if (conversation.status === 'paused_human' || activeHandoff) {
      logger.info(
        { conversationId: conversation.id, businessId: business.id },
        'Conversation is under human takeover. AI reply suppressed.'
      );
      return {
        status: 'routed_to_human',
        conversationId: conversation.id,
      };
    }

    // 9. Build strictly isolated grounded context for resolved business
    const groundedContext = await this.router.buildIsolatedGroundedContext(business.id, messageContent);

    // 10. Load recent conversation history
    const recentMessages = await this.db.getConversationMessages(conversation.id, 8);
    const history = recentMessages.map((m) => ({
      sender: m.sender_type as 'customer' | 'ai' | 'human_agent',
      text: m.content,
    }));

    // 11. Generate grounded AI response
    const aiProvider = getAIProvider();
    const aiResult = await aiProvider.generateReply(messageContent, history, groundedContext);

    // 12. Lead Management & CRM Qualification
    if (aiResult.detectedLeadInfo) {
      await this.leadService.processIncomingLeadData(
        business.id,
        contact,
        conversation.id,
        aiResult.detectedLeadInfo
      );
    }

    // 13. Escalation Handling (Confidence < threshold, pricing quote request, refund, human request)
    const threshold = groundedContext.settings.confidence_threshold || 0.8;
    const shouldEscalate = aiResult.shouldEscalate || aiResult.confidence < threshold;

    let finalReply = aiResult.replyText;

    if (shouldEscalate) {
      const reason = aiResult.escalationReason || 'low_ai_confidence_threshold';
      await this.handoffService.initiateTakeover(
        conversation.id,
        reason,
        reason === 'user_requested_human' ? 'user_request' : 'ai_grounding'
      );
      logger.info(
        { conversationId: conversation.id, reason, confidence: aiResult.confidence },
        'Triggered automatic human handoff and paused AI'
      );
    }

    // 14. Send reply via WhatsApp Cloud API
    const outResult = await waProvider.sendTextMessage(phoneNumberId, {
      to: from,
      text: finalReply,
    });

    // 15. Save AI response message
    await this.db.saveMessage({
      conversation_id: conversation.id,
      business_id: business.id,
      meta_message_id: outResult.messageId,
      sender_type: 'ai',
      message_type: 'text',
      content: finalReply,
      metadata: {
        confidence: aiResult.confidence,
        shouldEscalate,
        escalationReason: aiResult.escalationReason,
      },
      delivery_status: 'sent',
    });

    await this.db.touchConversation(conversation.id, 'business');

    return {
      status: shouldEscalate ? 'routed_to_human' : 'replied_by_ai',
      conversationId: conversation.id,
      replyText: finalReply,
      sentMessageId: outResult.messageId,
    };
  }
}
