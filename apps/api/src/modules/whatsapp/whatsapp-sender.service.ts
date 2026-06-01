import { Injectable, Logger } from '@nestjs/common';

interface InteractiveButton {
  id: string;
  title: string;
}

interface InteractiveSection {
  title: string;
  rows: Array<{
    id: string;
    title: string;
    description?: string;
  }>;
}

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 500;

@Injectable()
export class WhatsAppSenderService {
  private readonly logger = new Logger(WhatsAppSenderService.name);
  private readonly apiVersion = 'v21.0';
  private rateLimitUntil = 0;

  private get phoneNumberId(): string {
    return process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  }

  private get accessToken(): string {
    return process.env.WHATSAPP_ACCESS_TOKEN || '';
  }

  private get baseUrl(): string {
    return `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async sendText(to: string, text: string): Promise<string | null> {
    return this.sendPayload(to, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { preview_url: false, body: text },
    });
  }

  async sendButtons(
    to: string,
    bodyText: string,
    buttons: InteractiveButton[],
    headerText?: string,
    footerText?: string,
  ): Promise<string | null> {
    const payload: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: bodyText },
        action: {
          buttons: buttons.slice(0, 3).map((b) => ({
            type: 'reply',
            reply: { id: b.id, title: b.title.slice(0, 20) },
          })),
        },
      },
    };

    if (headerText) {
      payload.interactive.header = { type: 'text', text: headerText };
    }
    if (footerText) {
      payload.interactive.footer = { text: footerText };
    }

    return this.sendPayload(to, payload);
  }

  async sendList(
    to: string,
    bodyText: string,
    buttonText: string,
    sections: InteractiveSection[],
    headerText?: string,
    footerText?: string,
  ): Promise<string | null> {
    const payload: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'interactive',
      interactive: {
        type: 'list',
        body: { text: bodyText },
        action: {
          button: buttonText.slice(0, 20),
          sections: sections.map((s) => ({
            title: s.title.slice(0, 24),
            rows: s.rows.slice(0, 10).map((r) => ({
              id: r.id,
              title: r.title.slice(0, 24),
              description: r.description?.slice(0, 72),
            })),
          })),
        },
      },
    };

    if (headerText) {
      payload.interactive.header = { type: 'text', text: headerText };
    }
    if (footerText) {
      payload.interactive.footer = { text: footerText };
    }

    return this.sendPayload(to, payload);
  }

  async sendTemplate(
    to: string,
    templateName: string,
    languageCode: string = 'en',
    components?: any[],
  ): Promise<string | null> {
    const payload: any = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
      },
    };

    if (components?.length) {
      payload.template.components = components;
    }

    return this.sendPayload(to, payload);
  }

  async sendBulkTemplate(
    recipients: string[],
    templateName: string,
    languageCode: string = 'en',
    componentsFactory?: (phone: string) => any[]
  ): Promise<{ successful: string[]; failed: string[] }> {
    const successful: string[] = [];
    const failed: string[] = [];

    this.logger.log(`Starting bulk send of template '${templateName}' to ${recipients.length} recipients.`);

    for (let i = 0; i < recipients.length; i++) {
      const phone = recipients[i];
      const components = componentsFactory ? componentsFactory(phone) : undefined;
      
      try {
        const messageId = await this.sendTemplate(phone, templateName, languageCode, components);
        if (messageId) {
          successful.push(phone);
        } else {
          failed.push(phone);
        }
      } catch (err) {
        this.logger.error(`Failed to send bulk message to ${phone}: ${(err as Error).message}`);
        failed.push(phone);
      }

      if (i < recipients.length - 1) {
        await this.sleep(100);
      }
    }

    this.logger.log(`Bulk send complete. Successful: ${successful.length}, Failed: ${failed.length}`);
    return { successful, failed };
  }

  async sendImage(to: string, base64Image: string, caption?: string): Promise<string | null> {
    if (!this.accessToken || !this.phoneNumberId) {
      this.logger.warn('[DEV MODE] WhatsApp image → ' + to + ': ' + (caption || 'image'));
      return null;
    }

    try {
      return await this.uploadAndSendImage(to, base64Image, caption);
    } catch (error) {
      this.logger.error(`Failed to send image: ${(error as Error).message}`);
      return null;
    }
  }

  private async uploadAndSendImage(to: string, base64Image: string, caption?: string): Promise<string | null> {
    const uploadUrl = `https://graph.facebook.com/v21.0/${this.phoneNumberId}/media`;

    const binaryString = atob(base64Image);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'image/png' });

    const formData = new FormData();
    formData.append('messaging_product', 'whatsapp');
    formData.append('type', 'image/png');
    formData.append('file', blob, 'qr.png');

    let mediaId: string | null = null;

    try {
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + this.accessToken },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        this.logger.error('WhatsApp media upload failed: ' + errorText);
        
        if (errorText.includes('not in allowed list') || errorText.includes('131030')) {
          this.logger.warn('Phone not in allowed list - add to Meta console');
        } else if (errorText.includes('OAuthException') || errorText.includes('190')) {
          this.logger.warn('WhatsApp token may be expired - please refresh in Meta console');
        }
        return null;
      }

      const uploadResult = await uploadResponse.json();
      mediaId = uploadResult.id;

      if (!mediaId) {
        this.logger.error('WhatsApp media upload returned no ID');
        return null;
      }
    } catch (error) {
      this.logger.error('WhatsApp media upload error: ' + (error as Error).message);
      return null;
    }

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'image',
      image: { id: mediaId },
      context: caption ? { message_id: caption } : undefined,
    };

return this.sendPayload(to, payload);
  }

  private async sendPayload(to: string, payload: any): Promise<string | null> {
    if (!this.accessToken || !this.phoneNumberId) {
      const preview = payload.text?.body || payload.interactive?.body?.text || payload.template?.name || 'unknown';
      this.logger.warn('[DEV MODE] WhatsApp → ' + to + ': ' + preview);
      return null;
    }

    if (Date.now() < this.rateLimitUntil) {
      this.logger.warn('WhatsApp rate limited — skipping send to ' + to);
      return null;
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        this.logger.debug('Retry ' + (attempt + 1) + '/' + MAX_RETRIES + ' after ' + delay + 'ms for ' + to);
        await this.sleep(delay);
      }

      try {
        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + this.accessToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (response.status === 429) {
          const retryAfter = response.headers.get('retry-after');
          const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
          this.rateLimitUntil = Date.now() + waitMs;
          this.logger.warn('WhatsApp rate limited — backing off ' + waitMs + 'ms');
          continue;
        }

        if (response.status === 503 || response.status === 504) {
          lastError = new Error('Service unavailable (' + response.status + ')');
          continue;
        }

        if (!response.ok) {
          const errorBody = await response.text();
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            // Check for "not in allowed list" error - this is expected in dev mode
            if (errorBody.includes('not in allowed list') || errorBody.includes('131030')) {
              this.logger.warn('WhatsApp: Recipient not in allowed list (dev mode). Add phone to Meta console.');
              return null;
            }
            this.logger.error('WhatsApp API error [' + response.status + ']: ' + errorBody);
            return null;
          }
          lastError = new Error('API error ' + response.status + ': ' + errorBody);
          continue;
        }

        const result = await response.json();
        const messages = result && result.messages;
        const messageId = messages && messages[0] && messages[0].id;
        if (messageId) {
          this.logger.debug('WhatsApp sent to ' + to + ' → msgId: ' + messageId);
          return messageId;
        }
        this.logger.warn('WhatsApp response missing message ID: ' + JSON.stringify(result));
        return null;
      } catch (error) {
        lastError = error as Error;
        this.logger.warn('WhatsApp network error (attempt ' + (attempt + 1) + '): ' + lastError.message);
      }
    }

    this.logger.error('WhatsApp send failed after ' + MAX_RETRIES + ' attempts for ' + to + ': ' + (lastError ? lastError.message : 'unknown'));
    return null;
  }
}