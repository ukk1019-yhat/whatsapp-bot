-- Migration: 003_seed_businesses.sql
-- Description: Seed initial data for Edu Alt Tech and Setsuzoku

-- Fixed UUIDs for predictable references in development and tests
DO $$
DECLARE
    edu_id UUID := '11111111-1111-1111-1111-111111111111';
    setsu_id UUID := '22222222-2222-2222-2222-222222222222';
    superadmin_id UUID := '00000000-0000-0000-0000-000000000001';
    edu_admin_id UUID := '00000000-0000-0000-0000-000000000002';
    setsu_admin_id UUID := '00000000-0000-0000-0000-000000000003';
    edu_doc_id UUID := '33333333-3333-3333-3333-333333333331';
    setsu_doc_id UUID := '33333333-3333-3333-3333-333333333332';
    -- bcrypt hash for password "Password@123"
    default_pass_hash TEXT := '$2a$10$gXq1MhG4d1sK4P.yM1oXQ.6c.bWfQ04U2ElnC1V1R2QZ/iU3PZkY2';
BEGIN
    -- 1. Businesses
    INSERT INTO businesses (id, slug, display_name, category, website_url, whatsapp_phone_number_id, whatsapp_display_phone_number, status)
    VALUES 
    (
        edu_id,
        'edu-alt-tech',
        'Edu Alt Tech',
        'Education technology, AI education & courses',
        'https://www.edualttech.com/',
        'WHATSAPP_PHONE_ID_EDU_ALT_TECH',
        '+1 (555) 010-3382',
        'active'
    ),
    (
        setsu_id,
        'setsuzoku',
        'Setsuzoku',
        'Technology & digital solutions',
        'https://setsuzoku.example.com',
        'WHATSAPP_PHONE_ID_SETSUZOKU',
        '+1 (555) 010-8841',
        'active'
    )
    ON CONFLICT (id) DO NOTHING;

    -- 2. Business Settings
    INSERT INTO business_settings (business_id, system_prompt, confidence_threshold, auto_handoff_on_pricing, welcome_message, fallback_message)
    VALUES
    (
        edu_id,
        'You are the verified AI WhatsApp Assistant for Edu Alt Tech (https://www.edualttech.com/). You represent Edu Alt Tech for course enquiries, AI and future-skills training for students, teacher workshops, and school partnerships.
GROUNDING & ACCURACY MANDATES:
1. Grounding: Answer strictly using verified courses, programs, and FAQs in your knowledge base.
2. Zero Hallucination: Never invent or assume course prices, batch schedules, certificates, or unverified enrollment links. If price or schedule is not explicitly in your knowledge base, state clearly that it is available upon consultation and offer to connect with an admissions counselor.
3. Lead Capture: Inquire politely about the caller''s name, their role (student, parent, educator, school principal), and specific interests. Ask only one question at a time.
4. Escalation: Escalate refunds, fee reductions, special accommodations, admissions disputes, and unverified data to human staff.
5. WhatsApp Formatting: Use short, friendly, readable paragraphs with bullet points where appropriate.',
        0.80,
        TRUE,
        'Welcome to Edu Alt Tech! 🎓 We empower students and schools with cutting-edge AI and future-skills education. How can we help you today?',
        'I want to ensure you receive verified information. Let me connect you with an Edu Alt Tech education advisor who can guide you on schedules and enrollment.'
    ),
    (
        setsu_id,
        'You are the verified AI WhatsApp Consultant for Setsuzoku, a premier technology and digital engineering firm. You handle client enquiries regarding custom web and mobile development, AI solutions, business automation, SEO, and digital branding.
GROUNDING & ACCURACY MANDATES:
1. Grounding: Answer solely based on verified services and documented capabilities.
2. Zero Hallucination: Every client project requires custom architectural scoping. Never invent project pricing, fixed delivery dates, client references, or binding contractual guarantees.
3. Lead Capture & Scoping: Collect the client''s core project goals, platform preferences (web, mobile, AI), estimated budget range, and desired timeline. Ask only one focused question at a time.
4. Escalation: When the client requests an official quotation, RFP response, contractual commitment, or custom negotiation, arrange a discovery consultation with our technical solutions team.
5. WhatsApp Formatting: Keep replies concise, professional, consultative, and action-oriented.',
        0.80,
        TRUE,
        'Hello and welcome to Setsuzoku! ⚡ We build high-impact web, mobile, and AI solutions for forward-thinking businesses. What project or technology solution are you exploring?',
        'To give you an accurate scope and technical estimate, I will connect you with a Setsuzoku solutions architect. Could you share your email or preferred consultation time?'
    )
    ON CONFLICT (business_id) DO NOTHING;

    -- 3. Business Members
    INSERT INTO business_members (id, business_id, email, password_hash, full_name, role, is_active)
    VALUES
    (superadmin_id, NULL, 'admin@platform.local', default_pass_hash, 'Platform Super Admin', 'super_admin', TRUE),
    (edu_admin_id, edu_id, 'admin@edualttech.com', default_pass_hash, 'Edu Alt Tech Admin', 'brand_admin', TRUE),
    (setsu_admin_id, setsu_id, 'admin@setsuzoku.io', default_pass_hash, 'Setsuzoku Admin', 'brand_admin', TRUE)
    ON CONFLICT (id) DO NOTHING;

    -- 4. Verified Services
    -- Edu Alt Tech Services
    INSERT INTO services (business_id, name, category, description, eligibility, schedule_details, verified_price, registration_link, is_verified, is_active)
    VALUES
    (
        edu_id,
        'AI for Students: Future-Skills Bootcamp',
        'Student Courses',
        'Hands-on interactive program teaching prompt engineering, computer vision basics, ethical AI, and practical problem-solving using modern tools.',
        'Students in Grades 6 through 12',
        'Weekend batches: Saturday & Sunday, 10:00 AM - 12:00 PM IST (4 weeks duration)',
        '₹4,999 per student',
        'https://www.edualttech.com/enroll/ai-bootcamp',
        TRUE,
        TRUE
    ),
    (
        edu_id,
        'K-12 School AI Curriculum Partnership',
        'Institutional Partnerships',
        'Comprehensive institutional program integrating hands-on AI labs, textbook curricula, and project assessments into school STEM classes.',
        'Recognized K-12 Schools and Educational Boards',
        'Annual academic calendar deployment with quarterly milestone reviews',
        'Custom institutional pricing (requires school discovery meeting)',
        'https://www.edualttech.com/schools',
        TRUE,
        TRUE
    ),
    (
        edu_id,
        'Educator AI Readiness Certification',
        'Teacher Training',
        'Professional development workshop for teachers on incorporating AI responsibly in lesson plans, grading assistance, and classroom engagement.',
        'Primary, Secondary, and High School Educators',
        '2-day intensive weekend certification or flexible 4-evening track',
        '₹2,499 per educator (Institutional group discounts available)',
        'https://www.edualttech.com/teachers',
        TRUE,
        TRUE
    ),
    -- Setsuzoku Services
    (
        setsu_id,
        'Custom Web & SaaS Application Development',
        'Software Engineering',
        'Full-stack cloud applications built using React, Next.js, Node.js, and PostgreSQL with robust security, API design, and scalable infrastructure.',
        'Startups, SMEs, and Enterprise Clients',
        'Sprint-based delivery following agile sprints; typical MVP timeline is 6-10 weeks',
        'Scoped per project (custom proposal following discovery consultation)',
        'https://setsuzoku.example.com/consultation',
        TRUE,
        TRUE
    ),
    (
        setsu_id,
        'Mobile Application Development (iOS & Android)',
        'Mobile Development',
        'Native and cross-platform Flutter/React Native mobile applications with smooth offline sync, push notifications, and payment gateways.',
        'Businesses expanding to mobile-first user experiences',
        'Phased milestone delivery: UI/UX prototype, Alpha, Beta, App Store launch',
        'Scoped per project requirements',
        'https://setsuzoku.example.com/consultation',
        TRUE,
        TRUE
    ),
    (
        setsu_id,
        'Enterprise AI Solutions & Workflow Automation',
        'AI & Automation',
        'Custom conversational agents, Retrieval-Augmented Generation (RAG) pipelines, intelligent document processing, and internal API workflow automation.',
        'Businesses aiming to automate customer service, internal ops, or analytics',
        '2-week Proof of Concept followed by production deployment',
        'Scoped per workflow complexity',
        'https://setsuzoku.example.com/consultation',
        TRUE,
        TRUE
    ),
    (
        setsu_id,
        'Digital Marketing, SEO & Conversion Optimization',
        'Growth & Marketing',
        'Data-driven search engine optimization, content strategy, performance marketing, and analytics tracking to drive qualified business leads.',
        'B2B & B2C brands seeking scalable organic and paid traffic',
        'Monthly retainer with bi-weekly performance reviews',
        'Retainer packages starting after initial audit',
        'https://setsuzoku.example.com/consultation',
        TRUE,
        TRUE
    );

    -- 5. Verified FAQs
    -- Edu Alt Tech FAQs
    INSERT INTO faqs (business_id, question, answer, category, keywords, status)
    VALUES
    (
        edu_id,
        'What is Edu Alt Tech?',
        'Edu Alt Tech is an alternative education and school technology platform dedicated to equipping students, educators, and schools with hands-on AI literacy, future-ready skills, and modern STEM curricula.',
        'General',
        ARRAY['about', 'who', 'overview', 'mission'],
        'published'
    ),
    (
        edu_id,
        'Do students receive a certificate after completing the AI Bootcamp?',
        'Yes, students who attend at least 80% of sessions and submit their capstone project receive a verified Edu Alt Tech Certificate of Completion.',
        'Courses',
        ARRAY['certificate', 'certification', 'diploma'],
        'published'
    ),
    (
        edu_id,
        'How can a school partner with Edu Alt Tech for teacher training or curriculum?',
        'Schools can schedule an institutional partnership briefing. Our academic director will assess school infrastructure, train faculty, and deploy the AI curriculum. Please request a school consultation.',
        'Partnerships',
        ARRAY['school', 'partnership', 'teachers', 'institutional'],
        'published'
    ),
    -- Setsuzoku FAQs
    (
        setsu_id,
        'What technology stack does Setsuzoku specialize in?',
        'Setsuzoku specializes in modern cloud architectures: TypeScript, Node.js, React, Next.js, Python for AI/ML, PostgreSQL, Supabase, AWS, and Cloudflare.',
        'Technology',
        ARRAY['tech stack', 'frameworks', 'languages', 'architecture'],
        'published'
    ),
    (
        setsu_id,
        'How does Setsuzoku determine project costs?',
        'Each project is uniquely scoped based on architectural complexity, third-party integrations, design specifications, and deadlines. We provide a transparent fixed-price milestone or dedicated team proposal after a technical discovery call.',
        'Pricing',
        ARRAY['cost', 'price', 'quote', 'estimate', 'budget'],
        'published'
    ),
    (
        setsu_id,
        'Can Setsuzoku sign a Non-Disclosure Agreement (NDA) before we discuss details?',
        'Yes, Setsuzoku routinely signs bilateral NDAs before discussing proprietary project requirements and intellectual property.',
        'Security',
        ARRAY['nda', 'privacy', 'confidentiality', 'contract'],
        'published'
    );

    -- 6. Knowledge Documents & Chunks
    INSERT INTO knowledge_documents (id, business_id, title, source_type, content_raw, status, published_at)
    VALUES
    (
        edu_doc_id,
        edu_id,
        'Edu Alt Tech Core Knowledge & Course Directory',
        'manual_text',
        'Edu Alt Tech official prospectus: We offer AI bootcamps for school students, teacher certification programs, and full K-12 institutional STEM curriculum licensing. All courses are mentored by verified industry educators. Batch sizes are capped at 20 students to ensure individual attention.',
        'published',
        NOW()
    ),
    (
        setsu_doc_id,
        setsu_id,
        'Setsuzoku Digital Solutions Capability Brief',
        'manual_text',
        'Setsuzoku capability matrix: We engineer enterprise web apps, high-concurrency APIs, AI business automation agents, cross-platform mobile apps, and technical SEO campaigns. We operate with agile two-week sprints, CI/CD pipelines, and dedicated solutions architects.',
        'published',
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO knowledge_chunks (business_id, document_id, chunk_index, content, metadata, token_count)
    VALUES
    (
        edu_id,
        edu_doc_id,
        0,
        'Edu Alt Tech official prospectus: We offer AI bootcamps for school students, teacher certification programs, and full K-12 institutional STEM curriculum licensing. All courses are mentored by verified industry educators. Batch sizes are capped at 20 students to ensure individual attention.',
        '{"topic": "overview", "brand": "Edu Alt Tech"}'::jsonb,
        45
    ),
    (
        setsu_id,
        setsu_doc_id,
        0,
        'Setsuzoku capability matrix: We engineer enterprise web apps, high-concurrency APIs, AI business automation agents, cross-platform mobile apps, and technical SEO campaigns. We operate with agile two-week sprints, CI/CD pipelines, and dedicated solutions architects.',
        '{"topic": "overview", "brand": "Setsuzoku"}'::jsonb,
        42
    );

END $$;
