import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRepository } from '../../src/db/memory.repository.js';
import { BusinessRouter } from '../../src/services/routing/business.router.js';

describe('Cross-Business Knowledge Isolation', () => {
  let db: MemoryRepository;
  let router: BusinessRouter;

  beforeEach(() => {
    db = new MemoryRepository();
    router = new BusinessRouter(db);
  });

  it('should ensure Edu Alt Tech grounded context contains ZERO Setsuzoku information', async () => {
    const edu = await db.getBusinessBySlug('edu-alt-tech');
    expect(edu).not.toBeNull();

    const context = await router.buildIsolatedGroundedContext(edu!.id, 'bootcamp and web dev');

    // Context identity must be Edu Alt Tech
    expect(context.business.slug).toBe('edu-alt-tech');
    expect(context.business.display_name).toBe('Edu Alt Tech');

    // All services must belong strictly to Edu Alt Tech
    for (const service of context.services) {
      expect(service.business_id).toBe(edu!.id);
      expect(service.name).not.toContain('Custom Web');
      expect(service.name).not.toContain('Setsuzoku');
    }

    // All FAQs must belong strictly to Edu Alt Tech
    for (const faq of context.faqs) {
      expect(faq.business_id).toBe(edu!.id);
      expect(faq.answer).not.toContain('Setsuzoku');
    }

    // All chunks must belong strictly to Edu Alt Tech
    for (const chunk of context.chunks) {
      expect(chunk.business_id).toBe(edu!.id);
      expect(chunk.content).not.toContain('Setsuzoku');
    }
  });

  it('should ensure Setsuzoku grounded context contains ZERO Edu Alt Tech information', async () => {
    const setsu = await db.getBusinessBySlug('setsuzoku');
    expect(setsu).not.toBeNull();

    const context = await router.buildIsolatedGroundedContext(setsu!.id, 'curriculum and web dev');

    // Context identity must be Setsuzoku
    expect(context.business.slug).toBe('setsuzoku');
    expect(context.business.display_name).toBe('Setsuzoku');

    // All services must belong strictly to Setsuzoku
    for (const service of context.services) {
      expect(service.business_id).toBe(setsu!.id);
      expect(service.name).not.toContain('Bootcamp');
      expect(service.name).not.toContain('Edu Alt Tech');
    }

    // All FAQs must belong strictly to Setsuzoku
    for (const faq of context.faqs) {
      expect(faq.business_id).toBe(setsu!.id);
      expect(faq.answer).not.toContain('Edu Alt Tech');
    }

    // All chunks must belong strictly to Setsuzoku
    for (const chunk of context.chunks) {
      expect(chunk.business_id).toBe(setsu!.id);
      expect(chunk.content).not.toContain('Edu Alt Tech');
    }
  });
});
