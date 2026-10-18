import { IDatabaseRepository } from '../../db/repository.interface.js';
import { logger } from '../../logger/logger.js';
import { Business, BusinessSettings, GroundedContext } from '../../types/index.js';

export interface RouteResolution {
  business: Business;
  isSharedNumber: boolean;
  requiresClarification: boolean;
  clarificationPrompt?: string;
}

export class BusinessRouter {
  constructor(private db: IDatabaseRepository) {}

  /**
   * Resolves the target business from incoming WhatsApp message metadata or explicit selection.
   * Priority:
   * 1. Direct match on WhatsApp Phone Number ID (separate dedicated numbers by default)
   * 2. If shared number or explicit selection exists in conversation context, use selected business
   * 3. If shared and message contains explicit brand trigger (e.g., 'edu', 'setsuzoku'), resolve brand
   * 4. Otherwise, flag as requiresClarification and generate interactive disambiguation menu
   */
  async resolveBusiness(
    phoneNumberId: string,
    messageText?: string,
    existingConversationContext?: Record<string, unknown>
  ): Promise<RouteResolution | null> {
    // 1. Direct phone number ID match
    const directBusiness = await this.db.getBusinessByPhoneNumberId(phoneNumberId);
    if (directBusiness) {
      return {
        business: directBusiness,
        isSharedNumber: false,
        requiresClarification: false,
      };
    }

    // 2. Check if this is a configured shared phone number (or fallback test number)
    const allBusinesses = await this.db.getAllBusinesses();
    if (allBusinesses.length === 0) {
      logger.error('No registered businesses found in database');
      return null;
    }

    // Check existing conversation context for previous brand selection
    if (existingConversationContext?.selected_business_id) {
      const selectedBiz = allBusinesses.find(
        (b) => b.id === existingConversationContext.selected_business_id
      );
      if (selectedBiz) {
        return {
          business: selectedBiz,
          isSharedNumber: true,
          requiresClarification: false,
        };
      }
    }

    // 3. Inspect user message text for explicit brand intent
    if (messageText) {
      const lower = messageText.toLowerCase().trim();

      // Check Edu Alt Tech intent
      if (
        lower === '1' ||
        lower.includes('edu alt tech') ||
        lower.includes('edualttech') ||
        lower.includes('course') ||
        lower.includes('school') ||
        lower.includes('student') ||
        lower.includes('teacher training') ||
        lower.includes('bootcamp')
      ) {
        const edu = allBusinesses.find((b) => b.slug === 'edu-alt-tech');
        if (edu) {
          return {
            business: edu,
            isSharedNumber: true,
            requiresClarification: false,
          };
        }
      }

      // Check Setsuzoku intent
      if (
        lower === '2' ||
        lower.includes('setsuzoku') ||
        lower.includes('website') ||
        lower.includes('web app') ||
        lower.includes('mobile app') ||
        lower.includes('digital solutions') ||
        lower.includes('automation') ||
        lower.includes('seo')
      ) {
        const setsu = allBusinesses.find((b) => b.slug === 'setsuzoku');
        if (setsu) {
          return {
            business: setsu,
            isSharedNumber: true,
            requiresClarification: false,
          };
        }
      }
    }

    // 4. Ambiguous on shared line -> Prompt customer to select brand explicitly
    const eduBrand = allBusinesses.find((b) => b.slug === 'edu-alt-tech');
    const setsuBrand = allBusinesses.find((b) => b.slug === 'setsuzoku');

    return {
      business: eduBrand || allBusinesses[0],
      isSharedNumber: true,
      requiresClarification: true,
      clarificationPrompt:
        `Welcome! We support two specialized organizations on this line:\n\n` +
        `1️⃣ *Edu Alt Tech*: AI courses, student bootcamps, and school STEM partnerships\n` +
        `2️⃣ *Setsuzoku*: Custom web apps, mobile applications, AI solutions & SEO\n\n` +
        `Please reply with *1* for Edu Alt Tech or *2* for Setsuzoku so we can direct your enquiry to the right team.`,
    };
  }

  /**
   * Builds isolated grounded context for the resolved business only.
   * Guarantees zero cross-brand knowledge leakage.
   */
  async buildIsolatedGroundedContext(businessId: string, userQuery?: string): Promise<GroundedContext> {
    const business = await this.db.getBusinessById(businessId);
    if (!business) {
      throw new Error(`Business not found for ID: ${businessId}`);
    }

    const settings = (await this.db.getBusinessSettings(businessId)) || {
      id: `default-${businessId}`,
      business_id: businessId,
      system_prompt: `You are the assistant for ${business.display_name}.`,
      confidence_threshold: 0.8,
      auto_handoff_on_pricing: true,
      operating_hours: {
        timezone: 'Asia/Kolkata',
        weekdays: { open: '09:00', close: '19:00' },
        weekends: { open: '10:00', close: '16:00' },
      },
      escalation_contacts: [],
      welcome_message: `Welcome to ${business.display_name}!`,
      fallback_message: `Connecting you with a ${business.display_name} representative.`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Fetch verified services strictly filtered by business_id
    const services = await this.db.getServicesByBusiness(businessId, true);

    // Fetch verified FAQs strictly filtered by business_id
    const faqs = await this.db.getFAQsByBusiness(businessId, true);

    // Fetch knowledge chunks strictly filtered by business_id
    const chunks = await this.db.getKnowledgeChunks(businessId, userQuery);

    return {
      business,
      settings,
      services,
      faqs,
      chunks,
    };
  }
}
