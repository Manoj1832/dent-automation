import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  async sendAppointmentReminder(appointmentId: string, patientName: string, phone: string, date: string, time: string) {
    this.logger.log(`Reminder queued: ${appointmentId}`);
    this.eventEmitter.emit('appointment.reminder', { appointmentId, patientName, phone, date, time });
  }

  async sendAppointmentConfirmation(appointmentId: string, patientName: string, phone: string, date: string, time: string, doctor: string) {
    this.logger.log(`Confirmation queued: ${appointmentId}`);
    this.eventEmitter.emit('appointment.confirmed', { appointmentId, patientName, phone, date, time, doctor });
  }

  async sendWhatsAppMessage(phone: string, message: string, patientId?: string) {
    this.eventEmitter.emit('whatsapp.message', { phone, message, patientId });
  }

  async notifyDoctorDelay(appointmentIds: string[], phone: string, doctorName: string, delayMinutes: number) {
    this.eventEmitter.emit('doctor.delay', { appointmentIds, phone, doctorName, delayMinutes });
  }
}
