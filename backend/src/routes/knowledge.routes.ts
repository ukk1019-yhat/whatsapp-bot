import { Request, Response, Router } from 'express';
import { z } from 'zod';
import { getDbRepository } from '../db/index.js';
import { authenticateJWT, enforceTenantIsolation, requireRoles } from '../middleware/auth.js';

export const knowledgeRouter = Router();

knowledgeRouter.use(authenticateJWT);

// --- SERVICES ---

// GET /api/knowledge/services
knowledgeRouter.get('/services', async (req: Request, res: Response): Promise<void> => {
  const db = getDbRepository();
  const user = req.user!;
  let businessId = req.query.businessId?.toString();

  if (user.role !== 'super_admin') {
    businessId = user.businessId || undefined;
  }

  if (!businessId) {
    res.status(400).json({ error: 'businessId is required' });
    return;
  }

  const services = await db.getServicesByBusiness(businessId);
  res.status(200).json(services);
});

const serviceSchema = z.object({
  business_id: z.string(),
  name: z.string().min(1),
  category: z.string().min(1),
  description: z.string().min(1),
  eligibility: z.string().optional(),
  schedule_details: z.string().optional(),
  verified_price: z.string().optional(),
  registration_link: z.string().optional(),
  is_verified: z.boolean().default(true),
  is_active: z.boolean().default(true),
});

// POST /api/knowledge/services
knowledgeRouter.post(
  '/services',
  requireRoles(['super_admin', 'brand_admin']),
  enforceTenantIsolation((req) => req.body.business_id),
  async (req: Request, res: Response): Promise<void> => {
    const parsed = serviceSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid service payload', details: parsed.error.issues });
      return;
    }

    const db = getDbRepository();
    const created = await db.createService(parsed.data);

    await db.createAuditLog({
      business_id: parsed.data.business_id,
      member_id: req.user!.memberId,
      action: 'CREATE_SERVICE',
      entity_type: 'service',
      entity_id: created.id,
      details: { name: created.name },
    });

    res.status(201).json(created);
  }
);

// PUT /api/knowledge/services/:id
knowledgeRouter.put(
  '/services/:id',
  requireRoles(['super_admin', 'brand_admin']),
  async (req: Request, res: Response): Promise<void> => {
    const db = getDbRepository();
    const existing = await db.getServiceById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    if (req.user!.role !== 'super_admin' && existing.business_id !== req.user!.businessId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const updated = await db.updateService(req.params.id, req.body);
    res.status(200).json(updated);
  }
);

// DELETE /api/knowledge/services/:id
knowledgeRouter.delete(
  '/services/:id',
  requireRoles(['super_admin', 'brand_admin']),
  async (req: Request, res: Response): Promise<void> => {
    const db = getDbRepository();
    const existing = await db.getServiceById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    if (req.user!.role !== 'super_admin' && existing.business_id !== req.user!.businessId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    await db.deleteService(req.params.id);
    res.status(200).json({ success: true });
  }
);

// --- FAQS ---

// GET /api/knowledge/faqs
knowledgeRouter.get('/faqs', async (req: Request, res: Response): Promise<void> => {
  const db = getDbRepository();
  const user = req.user!;
  let businessId = req.query.businessId?.toString();

  if (user.role !== 'super_admin') {
    businessId = user.businessId || undefined;
  }

  if (!businessId) {
    res.status(400).json({ error: 'businessId is required' });
    return;
  }

  const faqs = await db.getFAQsByBusiness(businessId);
  res.status(200).json(faqs);
});

const faqSchema = z.object({
  business_id: z.string(),
  question: z.string().min(1),
  answer: z.string().min(1),
  category: z.string().default('General'),
  keywords: z.array(z.string()).default([]),
  status: z.enum(['draft', 'published', 'archived']).default('published'),
});

// POST /api/knowledge/faqs
knowledgeRouter.post(
  '/faqs',
  requireRoles(['super_admin', 'brand_admin']),
  enforceTenantIsolation((req) => req.body.business_id),
  async (req: Request, res: Response): Promise<void> => {
    const parsed = faqSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid FAQ payload', details: parsed.error.issues });
      return;
    }

    const db = getDbRepository();
    const created = await db.createFAQ(parsed.data);
    res.status(201).json(created);
  }
);

// PUT /api/knowledge/faqs/:id
knowledgeRouter.put(
  '/faqs/:id',
  requireRoles(['super_admin', 'brand_admin']),
  async (req: Request, res: Response): Promise<void> => {
    const db = getDbRepository();
    const existing = await db.getFAQById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'FAQ not found' });
      return;
    }

    if (req.user!.role !== 'super_admin' && existing.business_id !== req.user!.businessId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const updated = await db.updateFAQ(req.params.id, req.body);
    res.status(200).json(updated);
  }
);

// DELETE /api/knowledge/faqs/:id
knowledgeRouter.delete(
  '/faqs/:id',
  requireRoles(['super_admin', 'brand_admin']),
  async (req: Request, res: Response): Promise<void> => {
    const db = getDbRepository();
    const existing = await db.getFAQById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'FAQ not found' });
      return;
    }

    if (req.user!.role !== 'super_admin' && existing.business_id !== req.user!.businessId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    await db.deleteFAQ(req.params.id);
    res.status(200).json({ success: true });
  }
);

// --- DOCUMENTS & REVIEW/PUBLISH WORKFLOW ---

// GET /api/knowledge/documents
knowledgeRouter.get('/documents', async (req: Request, res: Response): Promise<void> => {
  const db = getDbRepository();
  const user = req.user!;
  let businessId = req.query.businessId?.toString();

  if (user.role !== 'super_admin') {
    businessId = user.businessId || undefined;
  }

  if (!businessId) {
    res.status(400).json({ error: 'businessId is required' });
    return;
  }

  const docs = await db.getKnowledgeDocuments(businessId);
  res.status(200).json(docs);
});

const docSchema = z.object({
  business_id: z.string(),
  title: z.string().min(1),
  source_type: z.enum(['pdf', 'doc', 'url', 'manual_text']),
  source_url: z.string().optional(),
  content_raw: z.string().min(10, 'Document content must be at least 10 characters'),
  status: z.enum(['draft', 'review_pending', 'published']).default('draft'),
});

// POST /api/knowledge/documents
knowledgeRouter.post(
  '/documents',
  requireRoles(['super_admin', 'brand_admin']),
  enforceTenantIsolation((req) => req.body.business_id),
  async (req: Request, res: Response): Promise<void> => {
    const parsed = docSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid document payload', details: parsed.error.issues });
      return;
    }

    const db = getDbRepository();
    const createdDoc = await db.createKnowledgeDocument({
      ...parsed.data,
      created_by: req.user!.memberId,
    });

    // Segment document into knowledge chunks (e.g., 500-char paragraphs)
    const rawParagraphs = parsed.data.content_raw
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 20);

    const chunks = rawParagraphs.map((paragraph, index) => ({
      business_id: parsed.data.business_id,
      document_id: createdDoc.id,
      chunk_index: index,
      content: paragraph,
      metadata: { sourceTitle: createdDoc.title, sourceType: createdDoc.source_type },
      token_count: Math.ceil(paragraph.length / 4),
    }));

    if (chunks.length > 0) {
      await db.saveKnowledgeChunks(chunks);
    }

    await db.createAuditLog({
      business_id: parsed.data.business_id,
      member_id: req.user!.memberId,
      action: 'CREATE_KNOWLEDGE_DOCUMENT',
      entity_type: 'knowledge_document',
      entity_id: createdDoc.id,
      details: { title: createdDoc.title, chunksGenerated: chunks.length },
    });

    res.status(201).json({ ...createdDoc, chunksCount: chunks.length });
  }
);

// POST /api/knowledge/documents/:id/publish (Review-and-Publish approval workflow)
knowledgeRouter.post(
  '/documents/:id/publish',
  requireRoles(['super_admin', 'brand_admin']),
  async (req: Request, res: Response): Promise<void> => {
    const db = getDbRepository();
    const existing = await db.getKnowledgeDocumentById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    if (req.user!.role !== 'super_admin' && existing.business_id !== req.user!.businessId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const updated = await db.updateKnowledgeDocument(req.params.id, {
      status: 'published',
      published_at: new Date().toISOString(),
    });

    await db.createAuditLog({
      business_id: existing.business_id,
      member_id: req.user!.memberId,
      action: 'PUBLISH_KNOWLEDGE_DOCUMENT',
      entity_type: 'knowledge_document',
      entity_id: req.params.id,
      details: { title: existing.title },
    });

    res.status(200).json({ success: true, document: updated });
  }
);
