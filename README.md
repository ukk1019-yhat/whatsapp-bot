# Multi-Brand AI WhatsApp Business Automation Platform

Production-oriented, multi-tenant AI automation platform that concurrently manages **Edu Alt Tech** and **Setsuzoku** through a shared backend while maintaining completely separate business identities, knowledge bases, customer leads, conversation contexts, services, and analytics.

Built with **Node.js, Express, TypeScript, Meta WhatsApp Cloud API, Supabase PostgreSQL, Vitest, and React**.

---

## 🏢 Business Configurations

| Attribute | **Brand A: Edu Alt Tech** 🎓 | **Brand B: Setsuzoku** ⚡ |
| :--- | :--- | :--- |
| **Domain & Website** | [https://www.edualttech.com/](https://www.edualttech.com/) | Tech & Digital Solutions |
| **Category** | Education technology, alternative education, AI education | Custom web & mobile software, enterprise AI, SEO |
| **Dedicated Phone ID** | `WHATSAPP_PHONE_ID_EDU_ALT_TECH` | `WHATSAPP_PHONE_ID_SETSUZOKU` |
| **Verified Offerings** | • AI for Students: Future-Skills Bootcamp (₹4,999)<br>• School AI Curriculum Partnership<br>• Teacher AI Certification (₹2,499) | • Custom Web & SaaS Development<br>• Mobile App Development (iOS & Android)<br>• Enterprise AI & Workflow Automation<br>• Digital Marketing & Technical SEO |
| **Grounding Mandate** | **Strict Zero-Hallucination**: Never invent course prices, schedules, certificates, or unverified links. | **Strict Scoping Mandate**: Never invent fixed quotes, deadlines, client references, or binding guarantees. |
| **Lead Flow** | Captures student, parent, educator, and school partnership inquiries. | Scopes project requirements, budgets, timelines, and schedules discovery calls. |
| **Escalation Rules** | Unverified discounts, refunds, admission disputes, and payment issues. | Custom quotations, RFP proposals, contract terms, and rate negotiations. |

---

## 🏛️ System Architecture

```mermaid
graph TD
    User([WhatsApp User]) -->|HTTPS Webhook| CloudEdge[Cloudflare / Edge Load Balancer]
    CloudEdge -->|POST /api/webhooks/whatsapp| WebhookRouter[Webhook Handler]

    subgraph Backend Core [Express + TypeScript]
        WebhookRouter --> SigValidator[HMAC-SHA256 Signature Validator]
        SigValidator --> Dedup[Meta Message Deduplicator]
        Dedup --> Router[Multi-Brand Router]
        
        Router -->|Phone Number ID lookup| BrandResolver{Resolve Brand}
        BrandResolver -->|Brand A Phone ID| EduContext[Edu Alt Tech Context]
        BrandResolver -->|Brand B Phone ID| SetsuContext[Setsuzoku Context]
        
        EduContext & SetsuContext --> HandoffCheck{Human Takeover Active?}
        HandoffCheck -->|YES: Paused| HumanQueue[Route to Human Agent Queue]
        HandoffCheck -->|NO: Active| AIEngine[AI Conversation Engine]
        
        AIEngine --> KBRetrieval[(Knowledge Retrieval - Scoped by business_id)]
        AIEngine --> LeadDetector[CRM Lead Qualification Extractor]
        AIEngine --> GroundingSafety[Hallucination & Uncertainty Verifier]
        
        GroundingSafety -->|Grounded Answer| OutQueue[WhatsApp Outbound Queue]
        GroundingSafety -->|Uncertain / Sensitive / Pricing| HandoffTrigger[Escalate & Pause AI]
        
        OutQueue --> WAProvider[IWhatsAppProvider Interface]
    end

    WAProvider -->|Meta Cloud API POST /v20.0/{phone_number_id}/messages| MetaAPI[Meta WhatsApp Cloud Platform]
    MetaAPI -->|Delivery| User

    subgraph Database [Supabase PostgreSQL + RLS]
        KBRetrieval <--> DB_KB[(knowledge_chunks, faqs, services)]
        LeadDetector <--> DB_Leads[(leads, contacts)]
        Router & Dedup <--> DB_Core[(businesses, conversations, messages, webhook_events)]
        HumanQueue <--> DB_Handoff[(handoffs, audit_logs)]
    end

    subgraph Admin Dashboard [React + Vite + TypeScript]
        AdminUser([Support & Sales Team]) <-->|JWT Auth HTTPS| AdminAPI[Admin REST API]
        AdminDashboard[Live Inbox, CRM Pipeline, KB Editor, Simulator]
    end
```

---

## 🔒 Security Architecture

1. **HMAC-SHA256 Webhook Verification**:
   - Every incoming Meta webhook is validated using `crypto.createHmac('sha256', META_APP_SECRET)`.
   - Timing-safe comparison (`crypto.timingSafeEqual`) prevents timing attacks.
   - Raw request body buffers are captured before JSON parsing to preserve byte-exact signatures.
2. **Tenant Isolation**:
   - All 16 database tables are strictly scoped with `business_id`.
   - Supabase Row Level Security (RLS) policies prevent cross-brand leakage.
   - Server-side middleware `enforceTenantIsolation` blocks unauthorized cross-tenant requests.
3. **Zero-Hallucination Grounding**:
   - AI answers strictly from verified services, published FAQs, and approved knowledge chunks.
   - System prompt instructions treat incoming user messages as untrusted input.
   - Fallback and uncertainty triggers escalate unverified pricing and refund requests directly to human staff.
4. **Prompt Injection Defense**:
   - Input sanitization strips control characters and blocks common jailbreak keywords (`ignore previous instructions`, `DAN mode`, `reveal system prompt`).
5. **PII and Secret Redaction**:
   - Structured logger (`pino`) automatically redacts access tokens, app secrets, passwords, and sensitive headers.
6. **24-Hour WhatsApp Service Window**:
   - Tracks customer interaction timestamps and prevents unauthorized template-less messages outside the Meta customer service window.
7. **Compliance & Opt-Out**:
   - Keywords `STOP`, `UNSUBSCRIBE`, or `CANCEL` immediately set `opt_in_status: 'opted_out'`, cease automated marketing messages, and log the action in `consent_records`.

---

## 🗄️ Database Schema (16 Tables)

Migrations are located in `backend/migrations/`:
- `001_initial_schema.sql`: Core tables, UUID primary keys, foreign keys, timestamps, indexes.
- `002_rls_policies.sql`: Supabase Row Level Security policies enforcing business isolation.
- `003_seed_businesses.sql`: Seed data for Edu Alt Tech, Setsuzoku, verified catalogs, FAQs, and members.

| Table Name | Description |
| :--- | :--- |
| `businesses` | Business identity, category, website, WhatsApp phone number ID. |
| `business_members` | Dashboard team members with RBAC (`super_admin`, `brand_admin`, `agent`). |
| `business_settings` | System prompts, confidence threshold, operating hours, escalation contacts. |
| `knowledge_documents`| Uploaded PDFs, URLs, and source documents with draft/published state. |
| `knowledge_chunks` | Scoped text chunks for semantic and keyword grounding. |
| `services` | Verified catalog offerings with verified pricing and registration links. |
| `faqs` | Verified Q&A pairs indexed by category and keywords. |
| `contacts` | Customer profiles, WhatsApp IDs, and opt-in/opt-out status. |
| `conversations` | Conversation threads, active brand, 24h service window timestamps. |
| `messages` | Full inbound & outbound history, Meta message IDs, delivery statuses. |
| `leads` | Sales & admissions CRM pipeline records with stage progression. |
| `handoffs` | Human takeover sessions, escalation reasons, and release timestamps. |
| `message_templates` | Meta-approved outbound notification templates. |
| `consent_records` | Opt-in / opt-out compliance history. |
| `webhook_events` | Idempotency log for raw webhooks. |
| `audit_logs` | Administrative and security action logs. |

---

## 🚀 Quickstart & Local Development

### Prerequisites
- Node.js LTS (v20+ or v22+)
- npm v10+

### 1. Clone & Install Dependencies
```bash
# Clone repository
git clone <repository-url>
cd "whatsapp chatbot"

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` in `backend/`:
```bash
cp backend/.env.example backend/.env
```
Default testing credentials are provided out of the box so that tests and local simulation run immediately without requiring live cloud credentials.

### 3. Run Automated Tests
```bash
cd backend
npm test
```
All 32 unit and integration tests will run using Vitest, validating webhook verification, HMAC signatures, multi-brand routing, zero-hallucination grounding, human handoff, and lead qualification.

### 4. Start Development Servers
**Terminal 1 (Backend API & Webhooks):**
```bash
cd backend
npm run dev
# Starts on http://localhost:3000
```

**Terminal 2 (Admin Dashboard & Simulator):**
```bash
cd frontend
npm run dev
# Starts on http://localhost:5173
```

---

## 🧪 Testing with the Interactive Simulator

The platform includes a built-in **Interactive Webhook & AI Grounding Simulator** available directly in the dashboard:
1. Open `http://localhost:5173` in your browser.
2. Sign in using one of the pre-configured role buttons:
   - **Platform Super Admin**: `admin@platform.local` / `Password@123`
   - **Edu Alt Tech Admin**: `admin@edualttech.com` / `Password@123`
   - **Setsuzoku Admin**: `admin@setsuzoku.io` / `Password@123`
3. Navigate to **AI Simulator** in the sidebar.
4. Try the one-click presets:
   - *Edu Alt Tech Bootcamp Enquiry* (tests verified fee grounding).
   - *Edu Alt Tech Fee Hallucination Test* (verifies that discounts are not invented).
   - *Setsuzoku Quotation Policy Test* (verifies custom scoping escalation).
   - *Prompt Injection Attack Test* (verifies injection sanitization).
   - *Refund & Takeover Test* (verifies automated AI pause and human takeover).

---

## 📲 Meta WhatsApp Cloud API Setup

### Step 1: Create Meta App
1. Navigate to the [Meta for Developers Portal](https://developers.facebook.com/).
2. Click **Create App** and select **Business** as the app type.
3. Add the **WhatsApp** product to your app.

### Step 2: Configure Webhook
1. In your Meta App Dashboard, go to **WhatsApp > Configuration**.
2. Set the **Callback URL**: `https://<your-domain>/api/webhooks/whatsapp`
3. Set the **Verify Token**: Must match your `META_VERIFY_TOKEN` in `.env`.
4. Subscribe to the following webhook fields:
   - `messages`
   - `message_status`

### Step 3: Configure Dedicated Phone Numbers
Under **API Setup**:
- Obtain the **Phone Number ID** for Edu Alt Tech and set `WHATSAPP_PHONE_ID_EDU_ALT_TECH`.
- Obtain the **Phone Number ID** for Setsuzoku and set `WHATSAPP_PHONE_ID_SETSUZOKU`.
- Generate a permanent System User Access Token and set `WHATSAPP_ACCESS_TOKEN`.
- Copy your App Secret from **App Settings > Basic** and set `META_APP_SECRET`.

---

## 📡 REST API Documentation

### Webhooks
- `GET /api/webhooks/whatsapp`: Meta webhook handshake challenge.
- `POST /api/webhooks/whatsapp`: Inbound WhatsApp events (HMAC-SHA256 signature verified).

### Authentication
- `POST /api/auth/login`: Admin & operator login (returns JWT).
- `GET /api/auth/me`: Get authenticated user profile.

### Conversations & Human Handoff
- `GET /api/conversations`: List threads (filterable by `businessId`, `status`).
- `GET /api/conversations/:id/messages`: Get message history.
- `POST /api/conversations/:id/messages`: Send live agent reply to WhatsApp user.
- `POST /api/conversations/:id/handoff`: Initiate manual takeover (pauses AI).
- `POST /api/conversations/:id/release`: Release takeover back to AI automation.

### Leads CRM
- `GET /api/leads`: List sales leads (filterable by `status`).
- `PATCH /api/leads/:id`: Update pipeline stage (`qualified`, `converted`, etc.).
- `GET /api/leads/export`: Download leads as CSV.

### Knowledge Base
- `GET/POST/PUT/DELETE /api/knowledge/services`: Verified catalog offerings.
- `GET/POST/PUT/DELETE /api/knowledge/faqs`: Verified brand FAQs.
- `GET/POST /api/knowledge/documents`: Knowledge sources.
- `POST /api/knowledge/documents/:id/publish`: Review and publish workflow.

### Health & Simulator
- `GET /api/health`: WhatsApp connection status, DB status, uptime.
- `POST /api/health/simulator`: Interactive webhook simulator endpoint.

---

## 🚢 Production Deployment

### Option A: Supabase + Cloud Run / Docker

1. **Database Migration**:
   ```bash
   export DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
   cd backend
   npm run db:migrate
   ```
2. **Build and Deploy**:
   Build the backend with `npm run build` and run `npm start`.
   Serve the built frontend bundle (`frontend/dist`) or host it on Cloudflare Pages / Vercel.

---

## 🛡️ Security & Compliance Checklist

- [x] Webhook signature verified with HMAC-SHA256 before processing.
- [x] Message deduplication active via Meta message IDs.
- [x] Tenant isolation enforced in all database queries and route middleware.
- [x] Strict zero-hallucination policy: unverified fees or timelines never invented.
- [x] Prompt injection attempts sanitized and blocked.
- [x] Human takeover suppresses automated AI replies to prevent conflicting messages.
- [x] User opt-out keywords (`STOP`, `UNSUBSCRIBE`) cease automated messaging.
- [x] Access tokens and secrets redacted in structured application logs.
- [x] 32 automated tests passing with 100% test suite health.
