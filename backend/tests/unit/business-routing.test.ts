import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRepository } from '../../src/db/memory.repository.js';
import { BusinessRouter } from '../../src/services/routing/business.router.js';

describe('Multi-Business Routing & Configuration Isolation', () => {
  let db: MemoryRepository;
  let router: BusinessRouter;

  beforeEach(() => {
    db = new MemoryRepository();
    router = new BusinessRouter(db);
  });

  it('should route by WhatsApp Phone Number ID to Edu Alt Tech', async () => {
    const resolution = await router.resolveBusiness('WHATSAPP_PHONE_ID_EDU_ALT_TECH');
    expect(resolution).not.toBeNull();
    expect(resolution?.business.slug).toBe('edu-alt-tech');
    expect(resolution?.business.display_name).toBe('Edu Alt Tech');
    expect(resolution?.requiresClarification).toBe(false);
  });

  it('should route by WhatsApp Phone Number ID to Setsuzoku', async () => {
    const resolution = await router.resolveBusiness('WHATSAPP_PHONE_ID_SETSUZOKU');
    expect(resolution).not.toBeNull();
    expect(resolution?.business.slug).toBe('setsuzoku');
    expect(resolution?.business.display_name).toBe('Setsuzoku');
    expect(resolution?.requiresClarification).toBe(false);
  });

  it('should resolve Edu Alt Tech on shared line when message contains education intent', async () => {
    const resolution = await router.resolveBusiness(
      'SHARED_NUMBER_12345',
      'Tell me about the student AI bootcamp course'
    );
    expect(resolution).not.toBeNull();
    expect(resolution?.business.slug).toBe('edu-alt-tech');
    expect(resolution?.requiresClarification).toBe(false);
  });

  it('should resolve Setsuzoku on shared line when message contains web/app dev intent', async () => {
    const resolution = await router.resolveBusiness(
      'SHARED_NUMBER_12345',
      'We need a custom web application and mobile app developed'
    );
    expect(resolution).not.toBeNull();
    expect(resolution?.business.slug).toBe('setsuzoku');
    expect(resolution?.requiresClarification).toBe(false);
  });

  it('should request clarification menu when inquiry on shared number is ambiguous', async () => {
    const resolution = await router.resolveBusiness('SHARED_NUMBER_12345', 'Hello, can you help me?');
    expect(resolution).not.toBeNull();
    expect(resolution?.requiresClarification).toBe(true);
    expect(resolution?.clarificationPrompt).toContain('Edu Alt Tech');
    expect(resolution?.clarificationPrompt).toContain('Setsuzoku');
  });

  it('should return null when database has no businesses configured', async () => {
    db.businesses.clear();
    const resolution = await router.resolveBusiness('ANY_ID');
    expect(resolution).toBeNull();
  });
});
