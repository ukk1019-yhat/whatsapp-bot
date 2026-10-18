import { env } from '../../config/env.js';
import { logger } from '../../logger/logger.js';
import {
  IWhatsAppProvider,
  OutgoingInteractiveMessage,
  OutgoingTextMessage,
} from '../../types/index.js';

export class MetaWhatsAppProvider implements IWhatsAppProvider {
  private baseUrl: string;
  private accessToken: string;

  constructor(accessToken?: string, apiVersion?: string) {
    this.accessToken = accessToken || env.WHATSAPP_ACCESS_TOKEN;
    const version = apiVersion || env.WHATSAPP_API_VERSION;
    this.baseUrl = `https://graph.facebook.com/${version}`;
  }

  private async makeRequestWithRetry(
    url: string,
    payload: Record<string, unknown>,
    maxRetries = 3
  ): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data = (await response.json()) as any;

        if (!response.ok) {
          const errMsg = data?.error?.message || `WhatsApp API error: HTTP ${response.status}`;
          const isTransient = response.status >= 500 || response.status === 429;
          logger.warn(
            { status: response.status, attempt, isTransient, errorTitle: data?.error?.title },
            'Meta WhatsApp API request failed'
          );

          if (isTransient && attempt < maxRetries) {
            const backoffMs = Math.pow(2, attempt) * 500;
            await new Promise((r) => setTimeout(r, backoffMs));
            continue;
          }
          throw new Error(errMsg);
        }

        return data;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 1000 * attempt));
        }
      }
    }

    throw lastError || new Error('Meta API request failed after retries');
  }

  async sendTextMessage(
    phoneNumberId: string,
    message: OutgoingTextMessage
  ): Promise<{ messageId: string }> {
    const url = `${this.baseUrl}/${phoneNumberId}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: message.to,
      type: 'text',
      text: {
        preview_url: message.previewUrl || false,
        body: message.text,
      },
    };

    logger.info({ phoneNumberId, to: message.to.slice(-4) }, 'Sending WhatsApp text message via Meta Cloud API');
    const response = await this.makeRequestWithRetry(url, payload);
    const messageId = response.messages?.[0]?.id || `wamid.${Date.now()}`;
    return { messageId };
  }

  async sendInteractiveMessage(
    phoneNumberId: string,
    message: OutgoingInteractiveMessage
  ): Promise<{ messageId: string }> {
    const url = `${this.baseUrl}/${phoneNumberId}/messages`;

    let interactivePayload: Record<string, unknown>;

    if (message.type === 'button') {
      interactivePayload = {
        type: 'button',
        body: { text: message.bodyText },
        action: {
          buttons: (message.buttons || []).map((b) => ({
            type: 'reply',
            reply: { id: b.id, title: b.title.substring(0, 20) },
          })),
        },
      };
      if (message.headerText) {
        (interactivePayload as any).header = { type: 'text', text: message.headerText };
      }
      if (message.footerText) {
        (interactivePayload as any).footer = { text: message.footerText };
      }
    } else {
      // List
      interactivePayload = {
        type: 'list',
        body: { text: message.bodyText },
        action: {
          button: 'Select Option',
          sections: (message.sections || []).map((s) => ({
            title: s.title,
            rows: s.rows.map((r) => ({
              id: r.id,
              title: r.title.substring(0, 24),
              description: r.description?.substring(0, 72),
            })),
          })),
        },
      };
    }

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: message.to,
      type: 'interactive',
      interactive: interactivePayload,
    };

    logger.info({ phoneNumberId, to: message.to.slice(-4) }, 'Sending WhatsApp interactive message via Meta Cloud API');
    const response = await this.makeRequestWithRetry(url, payload);
    const messageId = response.messages?.[0]?.id || `wamid.${Date.now()}`;
    return { messageId };
  }

  async markMessageAsRead(phoneNumberId: string, messageId: string): Promise<boolean> {
    const url = `${this.baseUrl}/${phoneNumberId}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    };

    try {
      await this.makeRequestWithRetry(url, payload, 2);
      return true;
    } catch (err) {
      logger.warn({ messageId }, 'Failed to mark WhatsApp message as read');
      return false;
    }
  }
}
