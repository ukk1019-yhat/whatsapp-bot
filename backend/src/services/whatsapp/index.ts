import { env } from '../../config/env.js';
import { IWhatsAppProvider } from '../../types/index.js';
import { MetaWhatsAppProvider } from './meta.whatsapp.provider.js';
import { MockWhatsAppProvider } from './mock.whatsapp.provider.js';

let defaultProvider: IWhatsAppProvider | null = null;
export const mockWhatsAppProviderInstance = new MockWhatsAppProvider();

export function getWhatsAppProvider(): IWhatsAppProvider {
  if (defaultProvider) return defaultProvider;

  if (
    env.NODE_ENV === 'test' ||
    env.WHATSAPP_ACCESS_TOKEN.startsWith('test_') ||
    env.WHATSAPP_ACCESS_TOKEN.includes('placeholder')
  ) {
    defaultProvider = mockWhatsAppProviderInstance;
    return defaultProvider;
  }

  defaultProvider = new MetaWhatsAppProvider();
  return defaultProvider;
}

export function setWhatsAppProvider(provider: IWhatsAppProvider): void {
  defaultProvider = provider;
}
