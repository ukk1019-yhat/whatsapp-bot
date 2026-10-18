import {
  AuditLog,
  Business,
  BusinessMember,
  BusinessSettings,
  Contact,
  Conversation,
  FAQItem,
  Handoff,
  KnowledgeChunk,
  KnowledgeDocument,
  Lead,
  LeadStatus,
  Message,
  ServiceItem,
  WebhookEventRecord,
} from '../types/index.js';

export interface IDatabaseRepository {
  // Businesses
  getAllBusinesses(): Promise<Business[]>;
  getBusinessById(id: string): Promise<Business | null>;
  getBusinessBySlug(slug: string): Promise<Business | null>;
  getBusinessByPhoneNumberId(phoneNumberId: string): Promise<Business | null>;
  updateBusiness(id: string, updates: Partial<Business>): Promise<Business | null>;

  // Business Settings
  getBusinessSettings(businessId: string): Promise<BusinessSettings | null>;
  updateBusinessSettings(businessId: string, settings: Partial<BusinessSettings>): Promise<BusinessSettings | null>;

  // Services
  getServicesByBusiness(businessId: string, verifiedOnly?: boolean): Promise<ServiceItem[]>;
  getServiceById(id: string): Promise<ServiceItem | null>;
  createService(service: Omit<ServiceItem, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceItem>;
  updateService(id: string, updates: Partial<ServiceItem>): Promise<ServiceItem | null>;
  deleteService(id: string): Promise<boolean>;

  // FAQs
  getFAQsByBusiness(businessId: string, publishedOnly?: boolean): Promise<FAQItem[]>;
  getFAQById(id: string): Promise<FAQItem | null>;
  createFAQ(faq: Omit<FAQItem, 'id' | 'created_at' | 'updated_at'>): Promise<FAQItem>;
  updateFAQ(id: string, updates: Partial<FAQItem>): Promise<FAQItem | null>;
  deleteFAQ(id: string): Promise<boolean>;

  // Knowledge Documents & Chunks
  getKnowledgeDocuments(businessId: string): Promise<KnowledgeDocument[]>;
  getKnowledgeDocumentById(id: string): Promise<KnowledgeDocument | null>;
  createKnowledgeDocument(doc: Omit<KnowledgeDocument, 'id' | 'created_at' | 'updated_at'>): Promise<KnowledgeDocument>;
  updateKnowledgeDocument(id: string, updates: Partial<KnowledgeDocument>): Promise<KnowledgeDocument | null>;
  deleteKnowledgeDocument(id: string): Promise<boolean>;
  getKnowledgeChunks(businessId: string, query?: string): Promise<KnowledgeChunk[]>;
  saveKnowledgeChunks(chunks: Array<Omit<KnowledgeChunk, 'id' | 'created_at'>>): Promise<void>;
  deleteChunksByDocumentId(documentId: string): Promise<void>;

  // Contacts
  getOrCreateContact(businessId: string, waId: string, phoneNumber: string, name?: string): Promise<Contact>;
  getContactById(id: string): Promise<Contact | null>;
  updateContact(id: string, updates: Partial<Contact>): Promise<Contact | null>;

  // Conversations
  getOrCreateConversation(businessId: string, contactId: string): Promise<Conversation>;
  getConversationById(id: string): Promise<Conversation | null>;
  getConversations(businessId?: string, status?: string): Promise<Conversation[]>;
  updateConversationStatus(
    id: string,
    status: Conversation['status'],
    contextData?: Record<string, unknown>
  ): Promise<Conversation | null>;
  touchConversation(id: string, senderType: 'customer' | 'business'): Promise<void>;

  // Messages
  saveMessage(msg: Omit<Message, 'id' | 'created_at'>): Promise<Message>;
  getMessageByMetaId(metaMessageId: string): Promise<Message | null>;
  updateMessageDeliveryStatus(
    metaMessageId: string,
    status: Message['delivery_status'],
    error?: string
  ): Promise<Message | null>;
  getConversationMessages(conversationId: string, limit?: number): Promise<Message[]>;

  // Leads
  createOrUpdateLead(lead: Partial<Lead> & {
    business_id: string;
    contact_id: string;
    phone_number: string;
    enquiry_category: string;
  }): Promise<Lead>;
  getLeads(businessId?: string, status?: string): Promise<Lead[]>;
  getLeadById(id: string): Promise<Lead | null>;
  updateLeadStatus(leadId: string, status: LeadStatus, notes?: string): Promise<Lead | null>;

  // Handoffs
  createHandoff(handoff: Omit<Handoff, 'id' | 'started_at'>): Promise<Handoff>;
  getActiveHandoff(conversationId: string): Promise<Handoff | null>;
  releaseHandoff(conversationId: string, memberId?: string): Promise<boolean>;
  getHandoffs(businessId?: string, status?: string): Promise<Handoff[]>;

  // Webhook Events
  recordWebhookEvent(
    eventId: string,
    businessId: string | null,
    eventType: string,
    payload: Record<string, unknown>
  ): Promise<WebhookEventRecord>;
  getWebhookEvent(eventId: string): Promise<WebhookEventRecord | null>;
  updateWebhookEventStatus(
    eventId: string,
    status: WebhookEventRecord['processing_status'],
    error?: string
  ): Promise<void>;

  // Members & Auth
  getMemberByEmail(email: string): Promise<BusinessMember | null>;
  getMemberById(id: string): Promise<BusinessMember | null>;

  // Audit Logs
  createAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): Promise<AuditLog>;
  getAuditLogs(businessId?: string, limit?: number): Promise<AuditLog[]>;

  // Analytics
  getAnalyticsSummary(businessId?: string): Promise<{
    totalConversations: number;
    activeConversations: number;
    totalMessages: number;
    totalLeads: number;
    qualifiedLeads: number;
    activeHandoffs: number;
    aiResponseRate: number;
  }>;
}
