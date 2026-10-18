import bcrypt from 'bcryptjs';
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
import { IDatabaseRepository } from './repository.interface.js';

export class MemoryRepository implements IDatabaseRepository {
  public businesses: Map<string, Business> = new Map();
  public businessSettings: Map<string, BusinessSettings> = new Map();
  public businessMembers: Map<string, BusinessMember> = new Map();
  public services: Map<string, ServiceItem> = new Map();
  public faqs: Map<string, FAQItem> = new Map();
  public knowledgeDocuments: Map<string, KnowledgeDocument> = new Map();
  public knowledgeChunks: Map<string, KnowledgeChunk> = new Map();
  public contacts: Map<string, Contact> = new Map();
  public conversations: Map<string, Conversation> = new Map();
  public messages: Map<string, Message> = new Map();
  public leads: Map<string, Lead> = new Map();
  public handoffs: Map<string, Handoff> = new Map();
  public webhookEvents: Map<string, WebhookEventRecord> = new Map();
  public auditLogs: AuditLog[] = [];

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData(): void {
    const defaultPasswordHash = bcrypt.hashSync('Password@123', 10);
    const now = new Date().toISOString();

    // 1. Businesses
    const eduBusiness: Business = {
      id: '11111111-1111-1111-1111-111111111111',
      slug: 'edu-alt-tech',
      display_name: 'Edu Alt Tech',
      category: 'Education technology, AI education & courses',
      website_url: 'https://www.edualttech.com/',
      whatsapp_phone_number_id: 'WHATSAPP_PHONE_ID_EDU_ALT_TECH',
      whatsapp_display_phone_number: '+1 (555) 010-3382',
      status: 'active',
      created_at: now,
      updated_at: now,
    };

    const setsuBusiness: Business = {
      id: '22222222-2222-2222-2222-222222222222',
      slug: 'setsuzoku',
      display_name: 'Setsuzoku',
      category: 'Technology & digital solutions',
      website_url: 'https://setsuzoku.example.com',
      whatsapp_phone_number_id: 'WHATSAPP_PHONE_ID_SETSUZOKU',
      whatsapp_display_phone_number: '+1 (555) 010-8841',
      status: 'active',
      created_at: now,
      updated_at: now,
    };

    this.businesses.set(eduBusiness.id, eduBusiness);
    this.businesses.set(setsuBusiness.id, setsuBusiness);

    // 2. Business Settings
    const eduSettings: BusinessSettings = {
      id: 'settings-edu-1',
      business_id: eduBusiness.id,
      system_prompt: `You are the verified AI WhatsApp Assistant for Edu Alt Tech (https://www.edualttech.com/). You assist students, parents, educators, and schools regarding courses, AI future-skills bootcamps, and school partnerships.
GROUNDING MANDATES:
1. Answer ONLY using verified course details, eligibility, fees, schedules, and FAQs from Edu Alt Tech's knowledge base.
2. NEVER invent course prices, schedules, certificates, availability, or enrollment links. If price or schedule is not verified, state that an admissions advisor will confirm it.
3. Lead capture: Inquire politely about the caller's name, role (student/parent/teacher/school rep), and interest area. Ask one question at a time.
4. Escalate questions regarding fees, refunds, discounts, and custom school agreements to human staff.
5. WhatsApp Tone: Concise, welcoming, formatted for mobile reading.`,
      confidence_threshold: 0.8,
      auto_handoff_on_pricing: true,
      operating_hours: {
        timezone: 'Asia/Kolkata',
        weekdays: { open: '09:00', close: '19:00' },
        weekends: { open: '10:00', close: '16:00' },
      },
      escalation_contacts: [{ name: 'Admissions Desk', email: 'admissions@edualttech.com', role: 'Counselor' }],
      welcome_message: 'Welcome to Edu Alt Tech! 🎓 We empower students and schools with cutting-edge AI and future-skills education. How can we help you today?',
      fallback_message: 'I want to make sure you get accurate, verified details. Let me connect you with an Edu Alt Tech education advisor.',
      created_at: now,
      updated_at: now,
    };

    const setsuSettings: BusinessSettings = {
      id: 'settings-setsu-2',
      business_id: setsuBusiness.id,
      system_prompt: `You are the verified AI WhatsApp Consultant for Setsuzoku, a premier technology and digital solutions firm. You handle client enquiries for website development, mobile apps, enterprise AI solutions, business automation, SEO, and digital branding.
GROUNDING MANDATES:
1. Answer strictly based on verified services and documented capabilities of Setsuzoku.
2. NEVER invent project quotes, delivery deadlines, client names, or contractual guarantees.
3. Lead qualification: Collect project requirements, preferred platforms (web/mobile/AI), estimated budget range, and timeline expectations. Ask one question at a time.
4. Escalate custom quotations, negotiations, contracts, and technical commitments to human solutions architects.
5. WhatsApp Tone: Polished, consulting-oriented, concise, and focused on value.`,
      confidence_threshold: 0.8,
      auto_handoff_on_pricing: true,
      operating_hours: {
        timezone: 'Asia/Kolkata',
        weekdays: { open: '09:00', close: '19:00' },
        weekends: { open: '10:00', close: '16:00' },
      },
      escalation_contacts: [{ name: 'Tech Solutions Team', email: 'consult@setsuzoku.io', role: 'Solutions Architect' }],
      welcome_message: 'Hello and welcome to Setsuzoku! ⚡ We engineer high-impact web, mobile, and AI solutions. What technology solution or project are you exploring?',
      fallback_message: 'To give you an accurate architectural scope and estimate, I will connect you with a Setsuzoku solutions architect.',
      created_at: now,
      updated_at: now,
    };

    this.businessSettings.set(eduSettings.business_id, eduSettings);
    this.businessSettings.set(setsuSettings.business_id, setsuSettings);

    // 3. Members
    const superAdmin: BusinessMember = {
      id: '00000000-0000-0000-0000-000000000001',
      business_id: null,
      email: 'admin@platform.local',
      password_hash: defaultPasswordHash,
      full_name: 'Platform Super Admin',
      role: 'super_admin',
      is_active: true,
      created_at: now,
      updated_at: now,
    };
    const eduAdmin: BusinessMember = {
      id: '00000000-0000-0000-0000-000000000002',
      business_id: eduBusiness.id,
      email: 'admin@edualttech.com',
      password_hash: defaultPasswordHash,
      full_name: 'Edu Alt Tech Admin',
      role: 'brand_admin',
      is_active: true,
      created_at: now,
      updated_at: now,
    };
    const setsuAdmin: BusinessMember = {
      id: '00000000-0000-0000-0000-000000000003',
      business_id: setsuBusiness.id,
      email: 'admin@setsuzoku.io',
      password_hash: defaultPasswordHash,
      full_name: 'Setsuzoku Admin',
      role: 'brand_admin',
      is_active: true,
      created_at: now,
      updated_at: now,
    };

    this.businessMembers.set(superAdmin.id, superAdmin);
    this.businessMembers.set(eduAdmin.id, eduAdmin);
    this.businessMembers.set(setsuAdmin.id, setsuAdmin);

    // 4. Services
    const eduServices: ServiceItem[] = [
      {
        id: 'svc-edu-1',
        business_id: eduBusiness.id,
        name: 'AI for Students: Future-Skills Bootcamp',
        category: 'Student Courses',
        description: 'Hands-on interactive program teaching prompt engineering, computer vision basics, ethical AI, and practical problem-solving using modern tools.',
        eligibility: 'Students in Grades 6 through 12',
        schedule_details: 'Weekend batches: Saturday & Sunday, 10:00 AM - 12:00 PM IST (4 weeks duration)',
        verified_price: '₹4,999 per student',
        registration_link: 'https://www.edualttech.com/enroll/ai-bootcamp',
        is_active: true,
        is_verified: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'svc-edu-2',
        business_id: eduBusiness.id,
        name: 'K-12 School AI Curriculum Partnership',
        category: 'Institutional Partnerships',
        description: 'Comprehensive institutional program integrating hands-on AI labs, textbook curricula, and project assessments into school STEM classes.',
        eligibility: 'Recognized K-12 Schools and Educational Boards',
        schedule_details: 'Annual academic calendar deployment with quarterly milestone reviews',
        verified_price: 'Custom institutional pricing (requires school discovery meeting)',
        registration_link: 'https://www.edualttech.com/schools',
        is_active: true,
        is_verified: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'svc-edu-3',
        business_id: eduBusiness.id,
        name: 'Educator AI Readiness Certification',
        category: 'Teacher Training',
        description: 'Professional development workshop for teachers on incorporating AI responsibly in lesson plans, grading assistance, and classroom engagement.',
        eligibility: 'Primary, Secondary, and High School Educators',
        schedule_details: '2-day intensive weekend certification or flexible 4-evening track',
        verified_price: '₹2,499 per educator',
        registration_link: 'https://www.edualttech.com/teachers',
        is_active: true,
        is_verified: true,
        created_at: now,
        updated_at: now,
      },
    ];

    const setsuServices: ServiceItem[] = [
      {
        id: 'svc-setsu-1',
        business_id: setsuBusiness.id,
        name: 'Custom Web & SaaS Application Development',
        category: 'Software Engineering',
        description: 'Full-stack cloud applications built using React, Next.js, Node.js, and PostgreSQL with robust security, API design, and scalable infrastructure.',
        eligibility: 'Startups, SMEs, and Enterprise Clients',
        schedule_details: 'Agile sprints; typical MVP timeline is 6-10 weeks',
        verified_price: 'Scoped per project (custom proposal following discovery consultation)',
        registration_link: 'https://setsuzoku.example.com/consultation',
        is_active: true,
        is_verified: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'svc-setsu-2',
        business_id: setsuBusiness.id,
        name: 'Mobile Application Development (iOS & Android)',
        category: 'Mobile Development',
        description: 'Native and cross-platform Flutter/React Native mobile applications with smooth offline sync, push notifications, and payment gateways.',
        eligibility: 'Businesses expanding to mobile-first user experiences',
        schedule_details: 'Phased milestone delivery: UI/UX prototype, Alpha, Beta, App Store launch',
        verified_price: 'Scoped per project requirements',
        registration_link: 'https://setsuzoku.example.com/consultation',
        is_active: true,
        is_verified: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'svc-setsu-3',
        business_id: setsuBusiness.id,
        name: 'Enterprise AI Solutions & Workflow Automation',
        category: 'AI & Automation',
        description: 'Custom conversational agents, Retrieval-Augmented Generation (RAG) pipelines, intelligent document processing, and internal API workflow automation.',
        eligibility: 'Businesses aiming to automate customer service, internal ops, or analytics',
        schedule_details: '2-week Proof of Concept followed by production deployment',
        verified_price: 'Scoped per workflow complexity',
        registration_link: 'https://setsuzoku.example.com/consultation',
        is_active: true,
        is_verified: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'svc-setsu-4',
        business_id: setsuBusiness.id,
        name: 'Digital Marketing, SEO & Conversion Optimization',
        category: 'Growth & Marketing',
        description: 'Data-driven search engine optimization, content strategy, performance marketing, and analytics tracking to drive qualified business leads.',
        eligibility: 'B2B & B2C brands seeking scalable organic and paid traffic',
        schedule_details: 'Monthly retainer with bi-weekly performance reviews',
        verified_price: 'Retainer packages starting after initial audit',
        registration_link: 'https://setsuzoku.example.com/consultation',
        is_active: true,
        is_verified: true,
        created_at: now,
        updated_at: now,
      },
    ];

    eduServices.forEach((s) => this.services.set(s.id, s));
    setsuServices.forEach((s) => this.services.set(s.id, s));

    // 5. FAQs
    const eduFaqs: FAQItem[] = [
      {
        id: 'faq-edu-1',
        business_id: eduBusiness.id,
        question: 'What is Edu Alt Tech?',
        answer: 'Edu Alt Tech is an alternative education and school technology platform dedicated to equipping students, educators, and schools with hands-on AI literacy, future-ready skills, and modern STEM curricula.',
        category: 'General',
        keywords: ['about', 'who', 'overview', 'mission'],
        status: 'published',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'faq-edu-2',
        business_id: eduBusiness.id,
        question: 'Do students receive a certificate after completing the AI Bootcamp?',
        answer: 'Yes, students who attend at least 80% of sessions and submit their capstone project receive a verified Edu Alt Tech Certificate of Completion.',
        category: 'Courses',
        keywords: ['certificate', 'certification', 'diploma'],
        status: 'published',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'faq-edu-3',
        business_id: eduBusiness.id,
        question: 'How can a school partner with Edu Alt Tech for teacher training or curriculum?',
        answer: 'Schools can schedule an institutional partnership briefing. Our academic director will assess school infrastructure, train faculty, and deploy the AI curriculum. Please request a school consultation.',
        category: 'Partnerships',
        keywords: ['school', 'partnership', 'teachers', 'institutional'],
        status: 'published',
        created_at: now,
        updated_at: now,
      },
    ];

    const setsuFaqs: FAQItem[] = [
      {
        id: 'faq-setsu-1',
        business_id: setsuBusiness.id,
        question: 'What technology stack does Setsuzoku specialize in?',
        answer: 'Setsuzoku specializes in modern cloud architectures: TypeScript, Node.js, React, Next.js, Python for AI/ML, PostgreSQL, Supabase, AWS, and Cloudflare.',
        category: 'Technology',
        keywords: ['tech stack', 'frameworks', 'languages', 'architecture'],
        status: 'published',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'faq-setsu-2',
        business_id: setsuBusiness.id,
        question: 'How does Setsuzoku determine project costs?',
        answer: 'Each project is uniquely scoped based on architectural complexity, third-party integrations, design specifications, and deadlines. We provide a transparent fixed-price milestone or dedicated team proposal after a technical discovery call.',
        category: 'Pricing',
        keywords: ['cost', 'price', 'quote', 'estimate', 'budget'],
        status: 'published',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'faq-setsu-3',
        business_id: setsuBusiness.id,
        question: 'Can Setsuzoku sign a Non-Disclosure Agreement (NDA) before we discuss details?',
        answer: 'Yes, Setsuzoku routinely signs bilateral NDAs before discussing proprietary project requirements and intellectual property.',
        category: 'Security',
        keywords: ['nda', 'privacy', 'confidentiality', 'contract'],
        status: 'published',
        created_at: now,
        updated_at: now,
      },
    ];

    eduFaqs.forEach((f) => this.faqs.set(f.id, f));
    setsuFaqs.forEach((f) => this.faqs.set(f.id, f));

    // 6. Knowledge Documents & Chunks
    const eduDoc: KnowledgeDocument = {
      id: 'doc-edu-1',
      business_id: eduBusiness.id,
      title: 'Edu Alt Tech Core Knowledge & Course Directory',
      source_type: 'manual_text',
      content_raw: 'Edu Alt Tech official prospectus: We offer AI bootcamps for school students, teacher certification programs, and full K-12 institutional STEM curriculum licensing. All courses are mentored by verified industry educators. Batch sizes are capped at 20 students to ensure individual attention.',
      status: 'published',
      published_at: now,
      created_at: now,
      updated_at: now,
    };

    const setsuDoc: KnowledgeDocument = {
      id: 'doc-setsu-1',
      business_id: setsuBusiness.id,
      title: 'Setsuzoku Digital Solutions Capability Brief',
      source_type: 'manual_text',
      content_raw: 'Setsuzoku capability matrix: We engineer enterprise web apps, high-concurrency APIs, AI business automation agents, cross-platform mobile apps, and technical SEO campaigns. We operate with agile two-week sprints, CI/CD pipelines, and dedicated solutions architects.',
      status: 'published',
      published_at: now,
      created_at: now,
      updated_at: now,
    };

    this.knowledgeDocuments.set(eduDoc.id, eduDoc);
    this.knowledgeDocuments.set(setsuDoc.id, setsuDoc);

    const chunk1: KnowledgeChunk = {
      id: 'chunk-edu-1',
      business_id: eduBusiness.id,
      document_id: eduDoc.id,
      chunk_index: 0,
      content: eduDoc.content_raw,
      metadata: { topic: 'overview', brand: 'Edu Alt Tech' },
      token_count: 45,
      created_at: now,
    };

    const chunk2: KnowledgeChunk = {
      id: 'chunk-setsu-1',
      business_id: setsuBusiness.id,
      document_id: setsuDoc.id,
      chunk_index: 0,
      content: setsuDoc.content_raw,
      metadata: { topic: 'overview', brand: 'Setsuzoku' },
      token_count: 42,
      created_at: now,
    };

    this.knowledgeChunks.set(chunk1.id, chunk1);
    this.knowledgeChunks.set(chunk2.id, chunk2);
  }

  // --- Businesses ---
  async getAllBusinesses(): Promise<Business[]> {
    return Array.from(this.businesses.values());
  }

  async getBusinessById(id: string): Promise<Business | null> {
    return this.businesses.get(id) || null;
  }

  async getBusinessBySlug(slug: string): Promise<Business | null> {
    return Array.from(this.businesses.values()).find((b) => b.slug === slug) || null;
  }

  async getBusinessByPhoneNumberId(phoneNumberId: string): Promise<Business | null> {
    return Array.from(this.businesses.values()).find((b) => b.whatsapp_phone_number_id === phoneNumberId) || null;
  }

  async updateBusiness(id: string, updates: Partial<Business>): Promise<Business | null> {
    const business = this.businesses.get(id);
    if (!business) return null;
    const updated = { ...business, ...updates, updated_at: new Date().toISOString() };
    this.businesses.set(id, updated);
    return updated;
  }

  // --- Settings ---
  async getBusinessSettings(businessId: string): Promise<BusinessSettings | null> {
    return this.businessSettings.get(businessId) || null;
  }

  async updateBusinessSettings(
    businessId: string,
    settings: Partial<BusinessSettings>
  ): Promise<BusinessSettings | null> {
    const existing = this.businessSettings.get(businessId);
    if (!existing) return null;
    const updated = { ...existing, ...settings, updated_at: new Date().toISOString() };
    this.businessSettings.set(businessId, updated);
    return updated;
  }

  // --- Services ---
  async getServicesByBusiness(businessId: string, verifiedOnly = false): Promise<ServiceItem[]> {
    return Array.from(this.services.values()).filter(
      (s) => s.business_id === businessId && (!verifiedOnly || (s.is_verified && s.is_active))
    );
  }

  async getServiceById(id: string): Promise<ServiceItem | null> {
    return this.services.get(id) || null;
  }

  async createService(service: Omit<ServiceItem, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceItem> {
    const now = new Date().toISOString();
    const newService: ServiceItem = {
      ...service,
      id: `svc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: now,
      updated_at: now,
    };
    this.services.set(newService.id, newService);
    return newService;
  }

  async updateService(id: string, updates: Partial<ServiceItem>): Promise<ServiceItem | null> {
    const existing = this.services.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
    this.services.set(id, updated);
    return updated;
  }

  async deleteService(id: string): Promise<boolean> {
    return this.services.delete(id);
  }

  // --- FAQs ---
  async getFAQsByBusiness(businessId: string, publishedOnly = false): Promise<FAQItem[]> {
    return Array.from(this.faqs.values()).filter(
      (f) => f.business_id === businessId && (!publishedOnly || f.status === 'published')
    );
  }

  async getFAQById(id: string): Promise<FAQItem | null> {
    return this.faqs.get(id) || null;
  }

  async createFAQ(faq: Omit<FAQItem, 'id' | 'created_at' | 'updated_at'>): Promise<FAQItem> {
    const now = new Date().toISOString();
    const newFaq: FAQItem = {
      ...faq,
      id: `faq-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: now,
      updated_at: now,
    };
    this.faqs.set(newFaq.id, newFaq);
    return newFaq;
  }

  async updateFAQ(id: string, updates: Partial<FAQItem>): Promise<FAQItem | null> {
    const existing = this.faqs.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
    this.faqs.set(id, updated);
    return updated;
  }

  async deleteFAQ(id: string): Promise<boolean> {
    return this.faqs.delete(id);
  }

  // --- Knowledge Documents & Chunks ---
  async getKnowledgeDocuments(businessId: string): Promise<KnowledgeDocument[]> {
    return Array.from(this.knowledgeDocuments.values()).filter((d) => d.business_id === businessId);
  }

  async getKnowledgeDocumentById(id: string): Promise<KnowledgeDocument | null> {
    return this.knowledgeDocuments.get(id) || null;
  }

  async createKnowledgeDocument(
    doc: Omit<KnowledgeDocument, 'id' | 'created_at' | 'updated_at'>
  ): Promise<KnowledgeDocument> {
    const now = new Date().toISOString();
    const newDoc: KnowledgeDocument = {
      ...doc,
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: now,
      updated_at: now,
    };
    this.knowledgeDocuments.set(newDoc.id, newDoc);
    return newDoc;
  }

  async updateKnowledgeDocument(
    id: string,
    updates: Partial<KnowledgeDocument>
  ): Promise<KnowledgeDocument | null> {
    const existing = this.knowledgeDocuments.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
    this.knowledgeDocuments.set(id, updated);
    return updated;
  }

  async deleteKnowledgeDocument(id: string): Promise<boolean> {
    await this.deleteChunksByDocumentId(id);
    return this.knowledgeDocuments.delete(id);
  }

  async getKnowledgeChunks(businessId: string, query?: string): Promise<KnowledgeChunk[]> {
    const chunks = Array.from(this.knowledgeChunks.values()).filter((c) => c.business_id === businessId);
    if (!query || query.trim() === '') return chunks;

    const lowerQuery = query.toLowerCase();
    const queryWords = lowerQuery.split(/\s+/).filter((w) => w.length > 2);

    // Keyword & lexical scoring matching
    return chunks
      .map((chunk) => {
        const text = chunk.content.toLowerCase();
        let score = 0;
        if (text.includes(lowerQuery)) score += 10;
        for (const word of queryWords) {
          if (text.includes(word)) score += 2;
        }
        return { chunk, score };
      })
      .filter((item) => item.score > 0 || queryWords.length === 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.chunk);
  }

  async saveKnowledgeChunks(chunks: Array<Omit<KnowledgeChunk, 'id' | 'created_at'>>): Promise<void> {
    const now = new Date().toISOString();
    for (const chunk of chunks) {
      const id = `chunk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      this.knowledgeChunks.set(id, { ...chunk, id, created_at: now });
    }
  }

  async deleteChunksByDocumentId(documentId: string): Promise<void> {
    for (const [id, chunk] of this.knowledgeChunks.entries()) {
      if (chunk.document_id === documentId) {
        this.knowledgeChunks.delete(id);
      }
    }
  }

  // --- Contacts ---
  async getOrCreateContact(
    businessId: string,
    waId: string,
    phoneNumber: string,
    name?: string
  ): Promise<Contact> {
    const key = `${businessId}:${waId}`;
    let contact = Array.from(this.contacts.values()).find(
      (c) => c.business_id === businessId && c.wa_id === waId
    );

    const now = new Date().toISOString();
    if (!contact) {
      contact = {
        id: `contact-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        business_id: businessId,
        wa_id: waId,
        phone_number: phoneNumber,
        name: name || undefined,
        opt_in_status: 'opted_in',
        opt_in_timestamp: now,
        metadata: {},
        created_at: now,
        updated_at: now,
      };
      this.contacts.set(contact.id, contact);
    } else if (name && !contact.name) {
      contact.name = name;
      contact.updated_at = now;
      this.contacts.set(contact.id, contact);
    }
    return contact;
  }

  async getContactById(id: string): Promise<Contact | null> {
    return this.contacts.get(id) || null;
  }

  async updateContact(id: string, updates: Partial<Contact>): Promise<Contact | null> {
    const existing = this.contacts.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
    this.contacts.set(id, updated);
    return updated;
  }

  // --- Conversations ---
  async getOrCreateConversation(businessId: string, contactId: string): Promise<Conversation> {
    let conversation = Array.from(this.conversations.values()).find(
      (c) => c.business_id === businessId && c.contact_id === contactId
    );

    const now = new Date().toISOString();
    if (!conversation) {
      conversation = {
        id: `conv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        business_id: businessId,
        contact_id: contactId,
        status: 'active',
        last_customer_message_at: now,
        window_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        context_data: {},
        created_at: now,
        updated_at: now,
      };
      this.conversations.set(conversation.id, conversation);
    }
    return conversation;
  }

  async getConversationById(id: string): Promise<Conversation | null> {
    return this.conversations.get(id) || null;
  }

  async getConversations(businessId?: string, status?: string): Promise<Conversation[]> {
    return Array.from(this.conversations.values()).filter(
      (c) => (!businessId || c.business_id === businessId) && (!status || c.status === status)
    );
  }

  async updateConversationStatus(
    id: string,
    status: Conversation['status'],
    contextData?: Record<string, unknown>
  ): Promise<Conversation | null> {
    const conv = this.conversations.get(id);
    if (!conv) return null;
    conv.status = status;
    if (contextData) {
      conv.context_data = { ...conv.context_data, ...contextData };
    }
    conv.updated_at = new Date().toISOString();
    this.conversations.set(id, conv);
    return conv;
  }

  async touchConversation(id: string, senderType: 'customer' | 'business'): Promise<void> {
    const conv = this.conversations.get(id);
    if (!conv) return;
    const now = new Date().toISOString();
    if (senderType === 'customer') {
      conv.last_customer_message_at = now;
      conv.window_expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    } else {
      conv.last_business_message_at = now;
    }
    conv.updated_at = now;
    this.conversations.set(id, conv);
  }

  // --- Messages ---
  async saveMessage(msg: Omit<Message, 'id' | 'created_at'>): Promise<Message> {
    const newMessage: Message = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
    };
    this.messages.set(newMessage.id, newMessage);
    return newMessage;
  }

  async getMessageByMetaId(metaMessageId: string): Promise<Message | null> {
    return Array.from(this.messages.values()).find((m) => m.meta_message_id === metaMessageId) || null;
  }

  async updateMessageDeliveryStatus(
    metaMessageId: string,
    status: Message['delivery_status'],
    error?: string
  ): Promise<Message | null> {
    const message = await this.getMessageByMetaId(metaMessageId);
    if (!message) return null;
    message.delivery_status = status;
    if (error) message.error_details = error;
    this.messages.set(message.id, message);
    return message;
  }

  async getConversationMessages(conversationId: string, limit = 50): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((m) => m.conversation_id === conversationId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .slice(-limit);
  }

  // --- Leads ---
  async createOrUpdateLead(lead: Partial<Lead> & {
    business_id: string;
    contact_id: string;
    phone_number: string;
    enquiry_category: string;
  }): Promise<Lead> {
    let existing = Array.from(this.leads.values()).find(
      (l) => l.business_id === lead.business_id && l.contact_id === lead.contact_id
    );

    const now = new Date().toISOString();
    if (existing) {
      existing = {
        ...existing,
        ...lead,
        customer_name: lead.customer_name || existing.customer_name,
        organization_or_school: lead.organization_or_school || existing.organization_or_school,
        requirements: lead.requirements || existing.requirements,
        budget_range: lead.budget_range || existing.budget_range,
        expected_timeline: lead.expected_timeline || existing.expected_timeline,
        updated_at: now,
      };
      this.leads.set(existing.id, existing);
      return existing;
    }

    const newLead: Lead = {
      id: `lead-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      business_id: lead.business_id,
      contact_id: lead.contact_id,
      conversation_id: lead.conversation_id,
      customer_name: lead.customer_name,
      phone_number: lead.phone_number,
      organization_or_school: lead.organization_or_school,
      enquiry_category: lead.enquiry_category,
      requirements: lead.requirements,
      budget_range: lead.budget_range,
      expected_timeline: lead.expected_timeline,
      lead_source: lead.lead_source || 'whatsapp_bot',
      status: lead.status || 'new',
      assigned_member_id: lead.assigned_member_id,
      next_follow_up_date: lead.next_follow_up_date,
      created_at: now,
      updated_at: now,
    };
    this.leads.set(newLead.id, newLead);
    return newLead;
  }

  async getLeads(businessId?: string, status?: string): Promise<Lead[]> {
    return Array.from(this.leads.values())
      .filter((l) => (!businessId || l.business_id === businessId) && (!status || l.status === status))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async getLeadById(id: string): Promise<Lead | null> {
    return this.leads.get(id) || null;
  }

  async updateLeadStatus(leadId: string, status: LeadStatus, notes?: string): Promise<Lead | null> {
    const lead = this.leads.get(leadId);
    if (!lead) return null;
    lead.status = status;
    lead.updated_at = new Date().toISOString();
    if (notes) {
      lead.requirements = lead.requirements ? `${lead.requirements}\n[Status Note]: ${notes}` : `[Status Note]: ${notes}`;
    }
    this.leads.set(leadId, lead);
    return lead;
  }

  // --- Handoffs ---
  async createHandoff(handoff: Omit<Handoff, 'id' | 'started_at'>): Promise<Handoff> {
    const newHandoff: Handoff = {
      ...handoff,
      id: `handoff-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      started_at: new Date().toISOString(),
    };
    this.handoffs.set(newHandoff.id, newHandoff);

    // Pause AI on conversation
    await this.updateConversationStatus(handoff.conversation_id, 'paused_human');
    return newHandoff;
  }

  async getActiveHandoff(conversationId: string): Promise<Handoff | null> {
    return (
      Array.from(this.handoffs.values()).find(
        (h) => h.conversation_id === conversationId && (h.status === 'pending' || h.status === 'active')
      ) || null
    );
  }

  async releaseHandoff(conversationId: string, memberId?: string): Promise<boolean> {
    const handoff = await this.getActiveHandoff(conversationId);
    if (!handoff) return false;
    handoff.status = 'released';
    handoff.released_at = new Date().toISOString();
    if (memberId) handoff.assigned_member_id = memberId;
    this.handoffs.set(handoff.id, handoff);

    // Resume AI automation
    await this.updateConversationStatus(conversationId, 'active');
    return true;
  }

  async getHandoffs(businessId?: string, status?: string): Promise<Handoff[]> {
    return Array.from(this.handoffs.values()).filter(
      (h) => (!businessId || h.business_id === businessId) && (!status || h.status === status)
    );
  }

  // --- Webhook Events ---
  async recordWebhookEvent(
    eventId: string,
    businessId: string | null,
    eventType: string,
    payload: Record<string, unknown>
  ): Promise<WebhookEventRecord> {
    const record: WebhookEventRecord = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      event_id: eventId,
      business_id: businessId || undefined,
      event_type: eventType,
      payload,
      processing_status: 'pending',
      received_at: new Date().toISOString(),
    };
    this.webhookEvents.set(eventId, record);
    return record;
  }

  async getWebhookEvent(eventId: string): Promise<WebhookEventRecord | null> {
    return this.webhookEvents.get(eventId) || null;
  }

  async updateWebhookEventStatus(
    eventId: string,
    status: WebhookEventRecord['processing_status'],
    error?: string
  ): Promise<void> {
    const record = this.webhookEvents.get(eventId);
    if (!record) return;
    record.processing_status = status;
    record.processed_at = new Date().toISOString();
    if (error) record.error_message = error;
    this.webhookEvents.set(eventId, record);
  }

  // --- Members & Auth ---
  async getMemberByEmail(email: string): Promise<BusinessMember | null> {
    const lower = email.toLowerCase().trim();
    return Array.from(this.businessMembers.values()).find((m) => m.email.toLowerCase() === lower) || null;
  }

  async getMemberById(id: string): Promise<BusinessMember | null> {
    return this.businessMembers.get(id) || null;
  }

  // --- Audit Logs ---
  async createAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): Promise<AuditLog> {
    const newLog: AuditLog = {
      ...log,
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
    };
    this.auditLogs.unshift(newLog);
    return newLog;
  }

  async getAuditLogs(businessId?: string, limit = 100): Promise<AuditLog[]> {
    return this.auditLogs
      .filter((l) => !businessId || l.business_id === businessId)
      .slice(0, limit);
  }

  // --- Analytics ---
  async getAnalyticsSummary(businessId?: string): Promise<{
    totalConversations: number;
    activeConversations: number;
    totalMessages: number;
    totalLeads: number;
    qualifiedLeads: number;
    activeHandoffs: number;
    aiResponseRate: number;
  }> {
    const convs = Array.from(this.conversations.values()).filter(
      (c) => !businessId || c.business_id === businessId
    );
    const msgs = Array.from(this.messages.values()).filter(
      (m) => !businessId || m.business_id === businessId
    );
    const leads = Array.from(this.leads.values()).filter(
      (l) => !businessId || l.business_id === businessId
    );
    const handoffs = Array.from(this.handoffs.values()).filter(
      (h) => (!businessId || h.business_id === businessId) && (h.status === 'pending' || h.status === 'active')
    );

    const aiMsgs = msgs.filter((m) => m.sender_type === 'ai').length;
    const customerMsgs = msgs.filter((m) => m.sender_type === 'customer').length;
    const aiResponseRate = customerMsgs > 0 ? Math.min(100, Math.round((aiMsgs / customerMsgs) * 100)) : 100;

    return {
      totalConversations: convs.length,
      activeConversations: convs.filter((c) => c.status === 'active').length,
      totalMessages: msgs.length,
      totalLeads: leads.length,
      qualifiedLeads: leads.filter((l) => l.status === 'qualified' || l.status === 'consultation_requested' || l.status === 'converted').length,
      activeHandoffs: handoffs.length,
      aiResponseRate,
    };
  }
}
