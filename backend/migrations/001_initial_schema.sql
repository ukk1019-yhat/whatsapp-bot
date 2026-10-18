-- Migration: 001_initial_schema.sql
-- Description: Multi-Brand WhatsApp Automation Platform Core Schema (16 Tables)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Businesses
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(64) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    website_url VARCHAR(255),
    whatsapp_phone_number_id VARCHAR(64) UNIQUE NOT NULL,
    whatsapp_display_phone_number VARCHAR(64),
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Business Members (Admin & Team Users)
CREATE TABLE IF NOT EXISTS business_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'agent' CHECK (role IN ('super_admin', 'brand_admin', 'agent', 'readonly')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Business Settings (AI prompts, operating hours, thresholds)
CREATE TABLE IF NOT EXISTS business_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID UNIQUE NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    system_prompt TEXT NOT NULL,
    confidence_threshold NUMERIC(3, 2) NOT NULL DEFAULT 0.75,
    auto_handoff_on_pricing BOOLEAN NOT NULL DEFAULT TRUE,
    operating_hours JSONB NOT NULL DEFAULT '{"timezone": "Asia/Kolkata", "weekdays": {"open": "09:00", "close": "19:00"}, "weekends": {"open": "10:00", "close": "16:00"}}'::jsonb,
    escalation_contacts JSONB NOT NULL DEFAULT '[]'::jsonb,
    welcome_message TEXT NOT NULL,
    fallback_message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Knowledge Documents (Sources, files, URLs)
CREATE TABLE IF NOT EXISTS knowledge_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    source_type VARCHAR(64) NOT NULL CHECK (source_type IN ('pdf', 'doc', 'url', 'manual_text')),
    source_url TEXT,
    content_raw TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review_pending', 'published', 'archived')),
    published_at TIMESTAMPTZ,
    created_by UUID REFERENCES business_members(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Knowledge Chunks (Segmented knowledge for semantic/keyword retrieval)
CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    token_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Services (Verified Courses or Technology Services)
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    eligibility TEXT,
    schedule_details TEXT,
    verified_price VARCHAR(100),
    registration_link TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. FAQs (Verified brand Q&A)
CREATE TABLE IF NOT EXISTS faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'general',
    keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
    status VARCHAR(32) NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Contacts (Customer Profiles)
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    wa_id VARCHAR(64) NOT NULL,
    phone_number VARCHAR(32) NOT NULL,
    name VARCHAR(255),
    organization_or_school VARCHAR(255),
    opt_in_status VARCHAR(32) NOT NULL DEFAULT 'opted_in' CHECK (opt_in_status IN ('opted_in', 'opted_out', 'pending')),
    opt_in_timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(business_id, wa_id)
);

-- 9. Conversations (Active threads)
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused_human', 'resolved', 'closed')),
    last_customer_message_at TIMESTAMPTZ,
    last_business_message_at TIMESTAMPTZ,
    window_expires_at TIMESTAMPTZ,
    context_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(business_id, contact_id)
);

-- 10. Messages (Message History)
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    meta_message_id VARCHAR(128) UNIQUE,
    sender_type VARCHAR(32) NOT NULL CHECK (sender_type IN ('customer', 'ai', 'human_agent', 'system')),
    sender_id VARCHAR(64),
    message_type VARCHAR(32) NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'interactive', 'template', 'image', 'document')),
    content TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    delivery_status VARCHAR(32) NOT NULL DEFAULT 'received' CHECK (delivery_status IN ('received', 'queued', 'sent', 'delivered', 'read', 'failed')),
    error_details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Leads (CRM Pipeline)
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    customer_name VARCHAR(255),
    phone_number VARCHAR(32) NOT NULL,
    organization_or_school VARCHAR(255),
    enquiry_category VARCHAR(100) NOT NULL,
    requirements TEXT,
    budget_range VARCHAR(100),
    expected_timeline VARCHAR(100),
    lead_source VARCHAR(64) NOT NULL DEFAULT 'whatsapp_bot',
    status VARCHAR(64) NOT NULL DEFAULT 'new' CHECK (status IN (
        'new', 'contacted', 'qualified', 'consultation_requested',
        'proposal_pending', 'converted', 'not_interested', 'closed'
    )),
    assigned_member_id UUID REFERENCES business_members(id) ON DELETE SET NULL,
    next_follow_up_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Handoffs (Human Takeover Sessions)
CREATE TABLE IF NOT EXISTS handoffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    assigned_member_id UUID REFERENCES business_members(id),
    status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'released', 'resolved')),
    escalation_reason VARCHAR(100) NOT NULL,
    escalation_notes TEXT,
    triggered_by VARCHAR(32) NOT NULL DEFAULT 'ai_grounding' CHECK (triggered_by IN ('user_request', 'ai_grounding', 'pricing_inquiry', 'complaint', 'admin_manual')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    released_at TIMESTAMPTZ
);

-- 13. Message Templates (Meta Approved Outbound Templates)
CREATE TABLE IF NOT EXISTS message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    category VARCHAR(64) NOT NULL,
    components JSONB NOT NULL,
    meta_status VARCHAR(32) NOT NULL DEFAULT 'approved' CHECK (meta_status IN ('approved', 'pending', 'rejected', 'paused')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(business_id, name, language)
);

-- 14. Consent Records (Opt-In / Opt-Out Compliance)
CREATE TABLE IF NOT EXISTS consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    wa_id VARCHAR(64) NOT NULL,
    action VARCHAR(32) NOT NULL CHECK (action IN ('opt_in', 'opt_out')),
    source VARCHAR(64) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Webhook Events (Audit and Idempotency)
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR(128) UNIQUE NOT NULL,
    business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
    event_type VARCHAR(64) NOT NULL,
    payload JSONB NOT NULL,
    processing_status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processed', 'ignored', 'failed')),
    error_message TEXT,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- 16. Audit Logs (Admin Actions & Security Trail)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    member_id UUID REFERENCES business_members(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64),
    ip_address VARCHAR(45),
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Essential Performance Indexes
CREATE INDEX IF NOT EXISTS idx_businesses_phone_number_id ON businesses(whatsapp_phone_number_id);
CREATE INDEX IF NOT EXISTS idx_business_members_business ON business_members(business_id);
CREATE INDEX IF NOT EXISTS idx_kchunks_business_doc ON knowledge_chunks(business_id, document_id);
CREATE INDEX IF NOT EXISTS idx_services_business ON services(business_id);
CREATE INDEX IF NOT EXISTS idx_faqs_business ON faqs(business_id);
CREATE INDEX IF NOT EXISTS idx_contacts_wa ON contacts(business_id, wa_id);
CREATE INDEX IF NOT EXISTS idx_conversations_business_contact ON conversations(business_id, contact_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_meta_id ON messages(meta_message_id);
CREATE INDEX IF NOT EXISTS idx_leads_business_status ON leads(business_id, status);
CREATE INDEX IF NOT EXISTS idx_handoffs_business_status ON handoffs(business_id, status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_id ON webhook_events(event_id);
