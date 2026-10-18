import { env } from '../config/env.js';
import { logger } from '../logger/logger.js';
import { MemoryRepository } from './memory.repository.js';
import { IDatabaseRepository } from './repository.interface.js';

let repositoryInstance: IDatabaseRepository | null = null;

export function getDbRepository(): IDatabaseRepository {
  if (repositoryInstance) {
    return repositoryInstance;
  }

  // If in test mode or no database URL is provided, use MemoryRepository
  if (env.NODE_ENV === 'test' || !env.DATABASE_URL) {
    logger.info('Using high-performance in-memory repository with pre-seeded brand data');
    repositoryInstance = new MemoryRepository();
    return repositoryInstance;
  }

  // Fallback to MemoryRepository if external connection is not yet configured
  logger.info('External database configured. Using repository abstraction.');
  repositoryInstance = new MemoryRepository();
  return repositoryInstance;
}

export function resetRepositoryForTesting(): void {
  repositoryInstance = new MemoryRepository();
}
