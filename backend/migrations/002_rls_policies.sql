-- Migration: 002_rls_policies.sql
-- Description: Supabase Row Level Security (RLS) policies for multi-tenant isolation

-- Enable RLS on all tenant-owned tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE handoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to extract user's business_id from JWT or context
CREATE OR REPLACE FUNCTION current_business_id() RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('request.jwt.claims', true)::jsonb->>'business_id', '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Helper function to check if current caller is super_admin
CREATE OR REPLACE FUNCTION is_super_admin() RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(
        (current_setting('request.jwt.claims', true)::jsonb->>'role') = 'super_admin',
        FALSE
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE;

-- Service role bypass policies (Used by backend webhook processing & system workers)
-- Notice: backend server using SUPABASE_SERVICE_ROLE_KEY bypasses RLS natively in Supabase.
-- The following policies enforce isolation when queries run through authenticated client roles:

-- 1. Businesses
CREATE POLICY businesses_tenant_isolation ON businesses
    FOR ALL
    USING (is_super_admin() OR id = current_business_id());

-- 2. Business Members
CREATE POLICY members_tenant_isolation ON business_members
    FOR ALL
    USING (is_super_admin() OR business_id = current_business_id());

-- 3. Business Settings
CREATE POLICY settings_tenant_isolation ON business_settings
    FOR ALL
    USING (is_super_admin() OR business_id = current_business_id());

-- 4. Knowledge Documents
CREATE POLICY documents_tenant_isolation ON knowledge_documents
    FOR ALL
    USING (is_super_admin() OR business_id = current_business_id());

-- 5. Knowledge Chunks
CREATE POLICY chunks_tenant_isolation ON knowledge_chunks
    FOR ALL
    USING (is_super_admin() OR business_id = current_business_id());

-- 6. Services
CREATE POLICY services_tenant_isolation ON services
    FOR ALL
    USING (is_super_admin() OR business_id = current_business_id());

-- 7. FAQs
CREATE POLICY faqs_tenant_isolation ON faqs
    FOR ALL
    USING (is_super_admin() OR business_id = current_business_id());

-- 8. Contacts
CREATE POLICY contacts_tenant_isolation ON contacts
    FOR ALL
    USING (is_super_admin() OR business_id = current_business_id());

-- 9. Conversations
CREATE POLICY conversations_tenant_isolation ON conversations
    FOR ALL
    USING (is_super_admin() OR business_id = current_business_id());

-- 10. Messages
CREATE POLICY messages_tenant_isolation ON messages
    FOR ALL
    USING (is_super_admin() OR business_id = current_business_id());

-- 11. Leads
CREATE POLICY leads_tenant_isolation ON leads
    FOR ALL
    USING (is_super_admin() OR business_id = current_business_id());

-- 12. Handoffs
CREATE POLICY handoffs_tenant_isolation ON handoffs
    FOR ALL
    USING (is_super_admin() OR business_id = current_business_id());

-- 13. Templates
CREATE POLICY templates_tenant_isolation ON message_templates
    FOR ALL
    USING (is_super_admin() OR business_id = current_business_id());

-- 14. Consent Records
CREATE POLICY consent_tenant_isolation ON consent_records
    FOR ALL
    USING (is_super_admin() OR business_id = current_business_id());

-- 15. Webhook Events
CREATE POLICY webhook_tenant_isolation ON webhook_events
    FOR ALL
    USING (is_super_admin() OR business_id = current_business_id());

-- 16. Audit Logs
CREATE POLICY audit_tenant_isolation ON audit_logs
    FOR ALL
    USING (is_super_admin() OR business_id = current_business_id());
