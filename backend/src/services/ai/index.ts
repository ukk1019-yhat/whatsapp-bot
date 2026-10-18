import { env } from '../../config/env.js';
import { IAIProvider } from '../../types/index.js';
import { MockAIProvider } from './mock.ai.provider.js';
import { OpenAIAIProvider } from './openai.ai.provider.js';

let defaultAIProvider: IAIProvider | null = null;
export const mockAIProviderInstance = new MockAIProvider();

export function getAIProvider(): IAIProvider {
  if (defaultAIProvider) return defaultAIProvider;

  if (
    env.AI_PROVIDER === 'mock' ||
    !env.AI_PROVIDER_API_KEY ||
    env.AI_PROVIDER_API_KEY.startsWith('test_')
  ) {
    defaultAIProvider = mockAIProviderInstance;
    return defaultAIProvider;
  }

  defaultAIProvider = new OpenAIAIProvider();
  return defaultAIProvider;
}

export function setAIProvider(provider: IAIProvider): void {
  defaultAIProvider = provider;
}
