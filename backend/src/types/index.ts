export type BusinessSlug = 'edu-alt-tech' | 'setsuzoku';

export interface Business {
  id: string;
  slug: BusinessSlug | string;
  display_name: string;
  category: string;
  website_url?: string;
  whatsapp_phone_number_id: string;
  whatsapp_display_phone_number?: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
}

export type UserRole = 'super_admin' | 'brand_admin' | 'agent' | 'readonly';

export interface BusinessMember {
  id: string;
  business_id: string | null; // null for super_admin
  email: string;
  password_hash: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessSettings {
  id: string;
  business_id: string;
  system_prompt: string;
  confidence_threshold: number;
  auto_handoff_on_pricing: boolean;
  operating_hours: {
    timezone: string;
    weekdays: { open: string; close: string };
    weekends: { open: string; close: string };
  };
  escalation_contacts: Array<{ name: string; email: string; role: string }>;
  welcome_message: string;
  fallback_message: string;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeDocument {
  id: string;
  business_id: string;
  title: string;
  source_type: 'pdf' | 'doc' | 'url' | 'manual_text';
  source_url?: string;
  content_raw: string;
  status: 'draft' | 'review_pending' | 'published' | 'archived';
  published_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeChunk {
  id: string;
  business_id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  metadata: Record<string, unknown>;
  token_count: number;
  created_at: string;
}

export interface ServiceItem {
  id: string;
  business_id: string;
  name: string;
  category: string;
  description: string;
  eligibility?: string;
  schedule_details?: string;
  verified_price?: string;
  registration_link?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface FAQItem {
  id: string;
  business_id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  business_id: string;
  wa_id: string;
  phone_number: string;
  name?: string;
  organization_or_school?: string;
  opt_in_status: 'opted_in' | 'opted_out' | 'pending';
  opt_in_timestamp: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  business_id: string;
  contact_id: string;
  status: 'active' | 'paused_human' | 'resolved' | 'closed';
  last_customer_message_at?: string;
  last_business_message_at?: string;
  window_expires_at?: string;
  context_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  business_id: string;
  meta_message_id?: string;
  sender_type: 'customer' | 'ai' | 'human_agent' | 'system';
  sender_id?: string;
  message_type: 'text' | 'interactive' | 'template' | 'image' | 'document';
  content: string;
  metadata: Record<string, unknown>;
  delivery_status: 'received' | 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
  error_details?: string;
  created_at: string;
}

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'consultation_requested'
  | 'proposal_pending'
  | 'converted'
  | 'not_interested'
  | 'closed';

export interface Lead {
  id: string;
  business_id: string;
  contact_id: string;
  conversation_id?: string;
  customer_name?: string;
  phone_number: string;
  organization_or_school?: string;
  enquiry_category: string;
  requirements?: string;
  budget_range?: string;
  expected_timeline?: string;
  lead_source: string;
  status: LeadStatus;
  assigned_member_id?: string;
  next_follow_up_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Handoff {
  id: string;
  business_id: string;
  conversation_id: string;
  assigned_member_id?: string;
  status: 'pending' | 'active' | 'released' | 'resolved';
  escalation_reason: string;
  escalation_notes?: string;
  triggered_by: 'user_request' | 'ai_grounding' | 'pricing_inquiry' | 'complaint' | 'admin_manual';
  started_at: string;
  released_at?: string;
}

export interface AuditLog {
  id: string;
  business_id?: string;
  member_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  ip_address?: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface WebhookEventRecord {
  id: string;
  event_id: string;
  business_id?: string;
  event_type: string;
  payload: Record<string, unknown>;
  processing_status: 'pending' | 'processed' | 'ignored' | 'failed';
  error_message?: string;
  received_at: string;
  processed_at?: string;
}

// WhatsApp Webhook Payloads
export interface MetaWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: { name: string };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: { body: string };
          interactive?: {
            type: string;
            button_reply?: { id: string; title: string };
            list_reply?: { id: string; title: string; description?: string };
          };
          image?: { id: string; mime_type: string; sha256: string };
        }>;
        statuses?: Array<{
          id: string;
          status: 'sent' | 'delivered' | 'read' | 'failed';
          timestamp: string;
          recipient_id: string;
          errors?: Array<{ code: number; title: string; message: string }>;
        }>;
      };
      field: string;
    }>;
  }>;
}

// Provider Interfaces
export interface OutgoingTextMessage {
  to: string;
  text: string;
  previewUrl?: boolean;
}

export interface OutgoingInteractiveMessage {
  to: string;
  type: 'button' | 'list';
  headerText?: string;
  bodyText: string;
  footerText?: string;
  buttons?: Array<{ id: string; title: string }>;
  sections?: Array<{
    title: string;
    rows: Array<{ id: string; title: string; description?: string }>;
  }>;
}

export interface IWhatsAppProvider {
  sendTextMessage(phoneNumberId: string, message: OutgoingTextMessage): Promise<{ messageId: string }>;
  sendInteractiveMessage(phoneNumberId: string, message: OutgoingInteractiveMessage): Promise<{ messageId: string }>;
  markMessageAsRead(phoneNumberId: string, messageId: string): Promise<boolean>;
}

export interface GroundedContext {
  business: Business;
  settings: BusinessSettings;
  services: ServiceItem[];
  faqs: FAQItem[];
  chunks: KnowledgeChunk[];
}

export interface AIResponseResult {
  replyText: string;
  confidence: number;
  shouldEscalate: boolean;
  escalationReason?: string;
  detectedLeadInfo?: {
    customerName?: string;
    organization?: string;
    enquiryCategory?: string;
    requirements?: string;
    budgetRange?: string;
    expectedTimeline?: string;
  };
}

export interface IAIProvider {
  generateReply(
    userMessage: string,
    history: Array<{ sender: 'customer' | 'ai' | 'human_agent'; text: string }>,
    groundedContext: GroundedContext
  ): Promise<AIResponseResult>;
}

export interface AuthTokenPayload {
  memberId: string;
  businessId: string | null;
  email: string;
  role: UserRole;
}
