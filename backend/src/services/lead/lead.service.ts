import { IDatabaseRepository } from '../../db/repository.interface.js';
import { logger } from '../../logger/logger.js';
import { Contact, Lead, LeadStatus } from '../../types/index.js';

export class LeadService {
  constructor(private db: IDatabaseRepository) {}

  async processIncomingLeadData(
    businessId: string,
    contact: Contact,
    conversationId: string,
    leadInfo?: {
      customerName?: string;
      organization?: string;
      enquiryCategory?: string;
      requirements?: string;
      budgetRange?: string;
      expectedTimeline?: string;
    }
  ): Promise<Lead | null> {
    if (!leadInfo || (!leadInfo.enquiryCategory && !leadInfo.requirements && !leadInfo.customerName)) {
      return null;
    }

    // Determine appropriate pipeline status
    let status: LeadStatus = 'new';
    if (leadInfo.budgetRange || leadInfo.expectedTimeline || leadInfo.organization) {
      status = 'qualified';
    }

    // If customer name was found, update contact profile as well
    if (leadInfo.customerName && !contact.name) {
      await this.db.updateContact(contact.id, { name: leadInfo.customerName });
    }
    if (leadInfo.organization && !contact.organization_or_school) {
      await this.db.updateContact(contact.id, { organization_or_school: leadInfo.organization });
    }

    const lead = await this.db.createOrUpdateLead({
      business_id: businessId,
      contact_id: contact.id,
      conversation_id: conversationId,
      customer_name: leadInfo.customerName || contact.name,
      phone_number: contact.phone_number,
      organization_or_school: leadInfo.organization || contact.organization_or_school,
      enquiry_category: leadInfo.enquiryCategory || 'General WhatsApp Lead',
      requirements: leadInfo.requirements,
      budget_range: leadInfo.budgetRange,
      expected_timeline: leadInfo.expectedTimeline,
      lead_source: 'whatsapp_ai_bot',
      status,
    });

    logger.info(
      { leadId: lead.id, businessId, status: lead.status },
      'Lead captured or updated in CRM pipeline'
    );

    return lead;
  }

  async updateLeadStatus(
    leadId: string,
    status: LeadStatus,
    adminMemberId?: string,
    notes?: string
  ): Promise<Lead | null> {
    const updated = await this.db.updateLeadStatus(leadId, status, notes);
    if (updated) {
      await this.db.createAuditLog({
        business_id: updated.business_id,
        member_id: adminMemberId,
        action: 'UPDATE_LEAD_STATUS',
        entity_type: 'lead',
        entity_id: leadId,
        details: { newStatus: status, notes },
      });
    }
    return updated;
  }
}
