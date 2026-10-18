import { AIResponseResult, GroundedContext, IAIProvider } from '../../types/index.js';
import { sanitizeUserInput } from './prompt.builder.js';

export class MockAIProvider implements IAIProvider {
  async generateReply(
    userMessage: string,
    history: Array<{ sender: 'customer' | 'ai' | 'human_agent'; text: string }>,
    groundedContext: GroundedContext
  ): Promise<AIResponseResult> {
    const sanitized = sanitizeUserInput(userMessage);
    const lower = sanitized.toLowerCase();
    const brandSlug = groundedContext.business.slug;

    // 1. Check for prompt injection attempt
    if (
      userMessage.toLowerCase().includes('ignore previous') ||
      userMessage.toLowerCase().includes('system prompt') ||
      userMessage.toLowerCase().includes('reveal your secret') ||
      sanitized.includes('[BLOCKED_INJECTION_PATTERN]')
    ) {
      return {
        replyText: `I am the official assistant for ${groundedContext.business.display_name}. I can only assist with verified services, educational programs, and technical solutions for our business. How may I help you with our offerings?`,
        confidence: 0.95,
        shouldEscalate: false,
      };
    }

    // 2. Escalation triggers: Complaints, refunds, legal, explicit human request
    if (
      lower.includes('refund') ||
      lower.includes('complaint') ||
      lower.includes('dispute') ||
      lower.includes('speak to human') ||
      lower.includes('talk to an agent') ||
      lower.includes('representative') ||
      lower.includes('human please')
    ) {
      return {
        replyText: `I understand your request. I am handing this conversation over to our human team at ${groundedContext.business.display_name} right away. A team member will join this chat shortly to assist you.`,
        confidence: 0.99,
        shouldEscalate: true,
        escalationReason: lower.includes('refund')
          ? 'refund_or_payment_dispute'
          : lower.includes('complaint')
            ? 'customer_complaint'
            : 'user_requested_human',
      };
    }

    // Extract lead information heuristics
    const detectedLeadInfo: AIResponseResult['detectedLeadInfo'] = {};

    // Name extraction: "My name is John" or "I am Alice"
    const nameMatch = sanitized.match(/(?:my name is|i am|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
    if (nameMatch) {
      detectedLeadInfo.customerName = nameMatch[1];
    }

    // School or Organization extraction: "from Greenfield School" or "at Acme Corp" or "from St. Xavier School"
    const orgMatch = sanitized.match(/(?:from|at|school|org|company)\s+([A-Z][a-zA-Z0-9\s.\-]+(?:School|Academy|College|Inc|LLC|Pvt|Ltd|Technologies|Tech)?)/i);
    if (orgMatch) {
      detectedLeadInfo.organization = orgMatch[1].trim();
    }

    // Budget extraction: "$5000" or "50k" or "budget of 10000"
    const budgetMatch = sanitized.match(/(?:budget|estimate|cost)?\s*(?:of|around|approx)?\s*(\$?\d+[\d,]*\s*(?:k|usd|inr|rs)?)/i);
    if (budgetMatch && (lower.includes('budget') || lower.includes('k') || lower.includes('$'))) {
      detectedLeadInfo.budgetRange = budgetMatch[1];
    }

    // Timeline extraction: "within 2 months" or "next month"
    const timelineMatch = sanitized.match(/(?:in|within|by|expected timeline:?)\s*(\d+\s*(?:weeks?|months?|days?)|next month|asap)/i);
    if (timelineMatch) {
      detectedLeadInfo.expectedTimeline = timelineMatch[1];
    }

    // --- BRAND A: Edu Alt Tech Specific Logic ---
    if (brandSlug === 'edu-alt-tech') {
      // Unverified price inquiry check (Must NOT hallucinate unverified prices)
      if (
        lower.includes('discount') ||
        lower.includes('scholarship') ||
        lower.includes('how much for 100 students') ||
        lower.includes('unverified course')
      ) {
        return {
          replyText: `Regarding custom group enrollments and scholarship rates for Edu Alt Tech, these are assessed individually. I have flagged your enquiry for our admissions team so they can confirm available options. Would you like to share your school or organization name?`,
          confidence: 0.85,
          shouldEscalate: true,
          escalationReason: 'pricing_negotiation_or_unverified_fee',
          detectedLeadInfo: {
            ...detectedLeadInfo,
            enquiryCategory: 'Admissions & Scholarships',
            requirements: sanitized,
          },
        };
      }

      // Course / Bootcamp inquiry
      if (lower.includes('bootcamp') || lower.includes('course') || lower.includes('student') || lower.includes('ai for students')) {
        const bootcamp = groundedContext.services.find((s) => s.name.includes('Bootcamp'));
        return {
          replyText: `Our *${bootcamp?.name || 'AI for Students Bootcamp'}* is designed for ${bootcamp?.eligibility || 'Grades 6-12'}.\n\n` +
            `• *Schedule*: ${bootcamp?.schedule_details}\n` +
            `• *Verified Fee*: ${bootcamp?.verified_price}\n` +
            `• *Enrollment Link*: ${bootcamp?.registration_link}\n\n` +
            `Would you like to enroll a student, or do you have any questions about the curriculum topics?`,
          confidence: 0.95,
          shouldEscalate: false,
          detectedLeadInfo: {
            ...detectedLeadInfo,
            enquiryCategory: 'Student AI Bootcamp',
            requirements: 'Interested in student AI bootcamp course details',
          },
        };
      }

      // School partnership inquiry
      if (lower.includes('school') || lower.includes('partnership') || lower.includes('principal') || lower.includes('curriculum')) {
        const schoolSvc = groundedContext.services.find((s) => s.category.includes('Institutional'));
        return {
          replyText: `For schools and academic institutions, Edu Alt Tech provides *${schoolSvc?.name || 'K-12 School AI Curriculum Partnership'}*:\n\n` +
            `• Integrated STEM curriculum & hands-on AI lab kits\n` +
            `• Faculty training and student progress tracking\n` +
            `• Verified Details: ${schoolSvc?.registration_link}\n\n` +
            `Could you share the name of your school and your current grade levels?`,
          confidence: 0.92,
          shouldEscalate: false,
          detectedLeadInfo: {
            ...detectedLeadInfo,
            enquiryCategory: 'School Partnership',
            requirements: 'School AI curriculum integration enquiry',
          },
        };
      }

      // Certificate inquiry
      if (lower.includes('certificate') || lower.includes('certification')) {
        const certFaq = groundedContext.faqs.find((f) => f.keywords.includes('certificate'));
        return {
          replyText: `${certFaq?.answer || 'Yes, students receive an official verified Edu Alt Tech Certificate of Completion upon attending 80% of sessions and completing the capstone project.'}\n\n` +
            `Would you like to register for the upcoming weekend cohort?`,
          confidence: 0.95,
          shouldEscalate: false,
        };
      }

      // General fallback grounded response for Edu Alt Tech
      return {
        replyText: `Edu Alt Tech empowers learners with verified AI bootcamps for school students, teacher certifications, and K-12 school curriculum partnerships. How can we support your educational goals today?`,
        confidence: 0.88,
        shouldEscalate: false,
        detectedLeadInfo: {
          ...detectedLeadInfo,
          enquiryCategory: 'General Course Enquiry',
          requirements: sanitized,
        },
      };
    }

    // --- BRAND B: Setsuzoku Specific Logic ---
    if (brandSlug === 'setsuzoku') {
      // Pricing / Quote request (Must NOT invent quotes)
      if (
        lower.includes('quote') ||
        lower.includes('price') ||
        lower.includes('cost') ||
        lower.includes('how much') ||
        lower.includes('estimate')
      ) {
        return {
          replyText: `At Setsuzoku, each software solution is custom-architected based on technical requirements, third-party integrations, and timeline. We never give generic numbers without understanding your scope.\n\n` +
            `To arrange a technical discovery consultation with a solutions architect, could you share your project's main objective and estimated timeline?`,
          confidence: 0.92,
          shouldEscalate: true,
          escalationReason: 'project_quotation_request',
          detectedLeadInfo: {
            ...detectedLeadInfo,
            enquiryCategory: 'Custom Project Quotation',
            requirements: sanitized,
          },
        };
      }

      // Web / App dev inquiry
      if (lower.includes('web') || lower.includes('app') || lower.includes('mobile') || lower.includes('saas') || lower.includes('software')) {
        return {
          replyText: `Setsuzoku engineers modern web applications and mobile apps (iOS & Android) using React, Next.js, Flutter, Node.js, and cloud platforms.\n\n` +
            `We follow 2-week agile sprints and build for enterprise security and scale.\n\n` +
            `What type of application are you planning to build (e.g. SaaS portal, mobile app, or internal tool)?`,
          confidence: 0.94,
          shouldEscalate: false,
          detectedLeadInfo: {
            ...detectedLeadInfo,
            enquiryCategory: 'Web & Mobile Development',
            requirements: sanitized,
          },
        };
      }

      // AI Solutions & Automation inquiry
      if (lower.includes('ai') || lower.includes('automation') || lower.includes('chatbot') || lower.includes('rag')) {
        return {
          replyText: `Setsuzoku develops custom enterprise AI solutions, including intelligent WhatsApp/web conversational agents, RAG document search engines, and business process automation.\n\n` +
            `Would you like to review a proof of concept for your specific workflow?`,
          confidence: 0.95,
          shouldEscalate: false,
          detectedLeadInfo: {
            ...detectedLeadInfo,
            enquiryCategory: 'AI & Automation Solutions',
            requirements: sanitized,
          },
        };
      }

      // General fallback grounded response for Setsuzoku
      return {
        replyText: `Setsuzoku delivers end-to-end digital engineering: custom web platforms, mobile apps, AI automation, and technical SEO. Could you describe the digital product or challenge you are looking to solve?`,
        confidence: 0.88,
        shouldEscalate: false,
        detectedLeadInfo: {
          ...detectedLeadInfo,
          enquiryCategory: 'Technology Solutions Discovery',
          requirements: sanitized,
        },
      };
    }

    // Default fallback
    return {
      replyText: `Thank you for contacting ${groundedContext.business.display_name}. How can we assist you with our verified services today?`,
      confidence: 0.85,
      shouldEscalate: false,
    };
  }
}
