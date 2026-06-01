import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WhatsAppSenderService } from '../../modules/whatsapp/whatsapp-sender.service';

@Injectable()
export class NotificationProcessor implements OnModuleDestroy {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly sender: WhatsAppSenderService) {}

  onModuleDestroy() {
    this.logger.log('NotificationProcessor shutting down');
  }

  @OnEvent('appointment.reminder')
  async handleReminder(payload: { appointmentId: string; patientName: string; phone: string; date: string; time: string }) {
    try {
      const message = `🔔 Hi ${payload.patientName}, reminder: Your appointment is on ${payload.date} at ${payload.time}. We look forward to seeing you!`;
      const messageId = await this.sender.sendText(payload.phone, message);
      if (messageId) {
        this.logger.log(`Reminder sent to ${payload.phone} for appointment ${payload.appointmentId}`);
      } else {
        this.logger.warn(`Reminder failed for ${payload.phone} (no messageId returned)`);
      }
    } catch (error) {
      this.logger.error(`Failed to send reminder to ${payload.phone}: ${error.message}`);
    }
  }

  @OnEvent('appointment.confirmed')
  async handleConfirmation(payload: { appointmentId: string; patientName: string; phone: string; date: string; time: string; doctor: string }) {
    try {
      const message = `✅ Hi ${payload.patientName}! Your appointment with Dr. ${payload.doctor} on ${payload.date} at ${payload.time} is confirmed. See you then!`;
      const messageId = await this.sender.sendText(payload.phone, message);
      this.logger.log(`Confirmation sent to ${payload.phone}: msgId=${messageId || 'none'}`);
    } catch (error) {
      this.logger.error(`Failed to send confirmation to ${payload.phone}: ${error.message}`);
    }
  }

  @OnEvent('whatsapp.message')
  async handleWhatsApp(payload: { phone: string; message: string; patientId?: string }) {
    try {
      const msg = payload.message || '';
      const truncated = msg.length > 50 ? msg.substring(0, 50) + '...' : msg;
      const messageId = await this.sender.sendText(payload.phone, truncated);
      this.logger.log(`WhatsApp outbound to ${payload.phone}: "${truncated}" → msgId=${messageId || 'none'}`);
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp to ${payload.phone}: ${error.message}`);
    }
  }

  @OnEvent('doctor.delay')
  async handleDoctorDelay(payload: { appointmentIds: string[]; phone: string; doctorName: string; delayMinutes: number }) {
    try {
      const message = `⏰ Hi! Dr. ${payload.doctorName} is running ${payload.delayMinutes} minutes late. We apologize for the delay and appreciate your patience.`;
      const messageId = await this.sender.sendText(payload.phone, message);
      this.logger.log(`Doctor delay notification sent to ${payload.phone}: msgId=${messageId || 'none'}`);
    } catch (error) {
      this.logger.error(`Failed to send doctor delay notification to ${payload.phone}: ${error.message}`);
    }
  }
}