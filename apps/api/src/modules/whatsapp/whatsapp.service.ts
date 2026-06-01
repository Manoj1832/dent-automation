import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import {
  WhatsAppWebhookDto,
  WhatsAppMessageDto,
  WhatsAppStatusDto,
} from './dto/webhook.dto';
import Redis from 'ioredis';

@Injectable()
export class WhatsAppService implements OnModuleDestroy {
  private readonly logger = new Logger(WhatsAppService.name);
  private redis: Redis | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      try {
        this.redis = new Redis(redisUrl, { maxRetriesPerRequest: 1, lazyConnect: false });
        this.redis.on('error', () => { this.redis = null; });
      } catch {
        this.logger.warn('WhatsAppService Redis init failed — falling back to DB deduplication');
      }
    }
  }

  onModuleDestroy() {
    if (this.redis) {
      this.redis.disconnect();
      this.redis = null;
    }
  }

  verifyWebhook(mode: string, token: string, challenge: string): string {
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'cliniq_secure_webhook';

    if (mode === 'subscribe' && token === verifyToken) {
      this.logger.log('✅ WhatsApp Webhook verified');
      return challenge;
    }

    throw new Error('Verification token mismatch');
  }

  async processWebhook(dto: WhatsAppWebhookDto): Promise<void> {
    if (!dto.entry || !dto.entry[0]) {
      this.logger.warn('Empty webhook payload received');
      return;
    }

    for (const entry of dto.entry) {
      if (!entry.changes) continue;
      
      for (const change of entry.changes) {
        if (change.field !== 'messages') continue;
        
        const value = change.value;
        if (!value) continue;

        if (value.messages?.length) {
          for (const message of value.messages) {
            try {
              await this.handleIncomingMessage(
                message,
                value.metadata?.phone_number_id || '',
                value.contacts?.[0]?.profile?.name,
              );
            } catch (error) {
              this.logger.error(`Failed to process message ${message.id}: ${error.message}`);
            }
          }
        }

        if (value.statuses?.length) {
          for (const status of value.statuses) {
            try {
              await this.handleStatusUpdate(status);
            } catch (error) {
              this.logger.error(`Failed to process status ${status.id}: ${error.message}`);
            }
          }
        }
      }
    }
  }

  private async handleIncomingMessage(
    message: WhatsAppMessageDto,
    botPhoneId: string,
    senderName?: string,
  ): Promise<void> {
    const metaMessageId = message.id;
    const phone = message.from;

    if (!phone) {
      this.logger.warn(`Incoming message ${metaMessageId} has no 'from' field — skipping`);
      return;
    }

    const normalizedPhone = this.normalizePhone(phone);

    if (this.redis) {
      const isNew = await this.redis.set(`wa_dedup:${metaMessageId}`, '1', 'EX', 86400, 'NX');
      if (!isNew) {
        this.logger.debug(`⚡ Redis: Duplicate message skipped: ${metaMessageId}`);
        return;
      }
    } else {
      const existingEvent = await this.prisma.webhookEvent.findUnique({
        where: { eventId: metaMessageId },
      });

      if (existingEvent?.processed) {
        this.logger.debug(`Duplicate message skipped: ${metaMessageId}`);
        return;
      }

      await this.prisma.webhookEvent.upsert({
        where: { eventId: metaMessageId },
        create: {
          eventId: metaMessageId,
          payload: message as any,
          processed: false,
        },
        update: {
          retryCount: { increment: 1 },
        },
      });
    }

    let content = '';
    let interactiveReplyId: string | undefined;

    if (message.type === 'text' && message.text) {
      content = message.text.body;
    } else if (message.type === 'interactive' && message.interactive) {
      const reply = message.interactive.button_reply || message.interactive.list_reply;
      if (reply) {
        content = reply.title || '';
        interactiveReplyId = reply.id;
      }
    } else if (message.type === 'image' && message.image) {
      content = '[Image]';
    } else if (message.type === 'video' && message.video) {
      content = '[Video]';
    } else if (message.type === 'audio' && message.audio) {
      content = '[Audio]';
    } else if (message.type === 'document' && message.document) {
      content = `[Document: ${message.document.filename || 'file'}]`;
    } else {
      content = `[${message.type} message]`;
    }

    try {
      if (!this.redis) {
        await this.prisma.webhookEvent.update({
          where: { eventId: metaMessageId },
          data: { processed: true },
        });
      }

      await this.prisma.whatsAppMessage.create({
        data: {
          wabaId: botPhoneId,
          phone: normalizedPhone,
          messageType: message.type,
          content: content.substring(0, 4096),
          messageId: metaMessageId,
          direction: 'inbound',
          status: 'received',
          rawPayload: message as any,
        },
      });

      this.eventEmitter.emit('whatsapp.message.received', {
        phone: normalizedPhone,
        content,
        messageType: message.type,
        interactiveReplyId,
        senderName,
        botPhoneId,
        waMessageId: metaMessageId,
        metaMessageId,
      });
    } catch (error) {
      this.logger.error(`Failed to persist message ${metaMessageId}: ${error.message}`);
      throw error;
    }
  }

  private async handleStatusUpdate(status: WhatsAppStatusDto): Promise<void> {
    try {
      const existing = await this.prisma.whatsAppMessage.findUnique({
        where: { messageId: status.id },
      });

      if (existing) {
        await this.prisma.whatsAppMessage.update({
          where: { id: existing.id },
          data: {
            deliveryStatus: status.status,
            status: status.status,
            errorCode: status.errors?.[0]?.code?.toString(),
            errorMessage: status.errors?.[0]?.title,
          } as any,
        });

        this.logger.debug(`📬 Status update: ${status.id} → ${status.status}`);
      }

      this.eventEmitter.emit('whatsapp.status.updated', {
        metaMessageId: status.id,
        status: status.status,
        recipientId: status.recipient_id,
        errors: status.errors,
      });
    } catch (error) {
      this.logger.error(`Status update failed for ${status.id}: ${error.message}`);
    }
  }

  private normalizePhone(phone: string): string {
    return phone.replace(/[\s\-\+]/g, '');
  }
}