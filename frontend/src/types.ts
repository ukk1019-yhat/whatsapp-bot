export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'super_admin' | 'brand_admin' | 'agent' | 'readonly';
  businessId: string | null;
  businessName: string | null;
}

export interface Business {
  id: string;
  slug: string;
  display_name: string;
  category: string;
  website_url?: string;
  whatsapp_phone_number_id: string;
  whatsapp_display_phone_number?: string;
  status: 'active' | 'inactive';
  settings?: BusinessSettings;
}

export interface BusinessSettings {
  id: string;
  business_id: string;
  system_prompt: string;
  confidence_threshold: number;
  auto_handoff_on_pricing: boolean;
  welcome_message: string;
  fallback_message: string;
  operating_hours: {
    timezone: string;
    weekdays: { open: string; close: string };
    weekends: { open: string; close: string };
  };
  escalation_contacts: Array<{ name: string; email: string; role: string }>;
}

export interface ConversationSummary {
  id: string;
  business_id: string;
  contact_id: string;
  status: 'active' | 'paused_human' | 'resolved' | 'closed';
  contactName: string;
  contactPhone: string;
  contactOrg?: string;
  isHumanTakeover: boolean;
  lastMessagePreview?: string;
  last_customer_message_at?: string;
  last_business_message_at?: string;
}

export interface MessageItem {
  id: string;
  conversation_id: string;
  business_id: string;
  meta_message_id?: string;
  sender_type: 'customer' | 'ai' | 'human_agent' | 'system';
  message_type: string;
  content: string;
  delivery_status: 'received' | 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
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

export interface LeadItem {
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
  status: LeadStatus;
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
}

export interface FAQItem {
  id: string;
  business_id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
  status: 'draft' | 'published' | 'archived';
}

export interface KnowledgeDocument {
  id: string;
  business_id: string;
  title: string;
  source_type: string;
  content_raw: string;
  status: 'draft' | 'review_pending' | 'published' | 'archived';
  published_at?: string;
}

export interface AnalyticsSummary {
  totalConversations: number;
  activeConversations: number;
  totalMessages: number;
  totalLeads: number;
  qualifiedLeads: number;
  activeHandoffs: number;
  aiResponseRate: number;
}
