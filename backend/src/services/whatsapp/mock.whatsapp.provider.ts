import {
  IWhatsAppProvider,
  OutgoingInteractiveMessage,
  OutgoingTextMessage,
} from '../../types/index.js';

export interface SentMessageLog {
  phoneNumberId: string;
  type: 'text' | 'interactive';
  to: string;
  payload: OutgoingTextMessage | OutgoingInteractiveMessage;
  timestamp: string;
  messageId: string;
}

export class MockWhatsAppProvider implements IWhatsAppProvider {
  public sentMessages: SentMessageLog[] = [];
  public markedReadIds: string[] = [];
  public shouldFailNextRequest = false;

  async sendTextMessage(
    phoneNumberId: string,
    message: OutgoingTextMessage
  ): Promise<{ messageId: string }> {
    if (this.shouldFailNextRequest) {
      this.shouldFailNextRequest = false;
      throw new Error('Mock WhatsApp API simulated network failure (HTTP 500)');
    }

    const messageId = `wamid.mock.${Date.now()}.${Math.random().toString(36).substring(2, 7)}`;
    this.sentMessages.push({
      phoneNumberId,
      type: 'text',
      to: message.to,
      payload: message,
      timestamp: new Date().toISOString(),
      messageId,
    });
    return { messageId };
  }

  async sendInteractiveMessage(
    phoneNumberId: string,
    message: OutgoingInteractiveMessage
  ): Promise<{ messageId: string }> {
    if (this.shouldFailNextRequest) {
      this.shouldFailNextRequest = false;
      throw new Error('Mock WhatsApp API simulated network failure (HTTP 500)');
    }

    const messageId = `wamid.mock.${Date.now()}.${Math.random().toString(36).substring(2, 7)}`;
    this.sentMessages.push({
      phoneNumberId,
      type: 'interactive',
      to: message.to,
      payload: message,
      timestamp: new Date().toISOString(),
      messageId,
    });
    return { messageId };
  }

  async markMessageAsRead(phoneNumberId: string, messageId: string): Promise<boolean> {
    this.markedReadIds.push(messageId);
    return true;
  }

  clearLogs(): void {
    this.sentMessages = [];
    this.markedReadIds = [];
    this.shouldFailNextRequest = false;
  }
}
