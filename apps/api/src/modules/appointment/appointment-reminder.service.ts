import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { WhatsAppSenderService } from '../whatsapp/whatsapp-sender.service';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../common/redis.module';

@Injectable()
export class AppointmentReminderService {
  private readonly logger = new Logger(AppointmentReminderService.name);
  private redis: Redis | null = null;
  private readonly REMINDER_KEY = 'appt:reminder:sent:';
  private readonly MISSED_KEY = 'appt:missed:sent:';

  constructor(
    private readonly prisma: PrismaService,
    @Inject(WhatsAppSenderService) @Optional() private readonly whatsappSender: WhatsAppSenderService | null,
    @Inject(REDIS_CLIENT) @Optional() sharedRedis: Redis | null,
  ) {
    this.redis = sharedRedis;
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleAppointmentReminders() {
    if (!this.whatsappSender) {
      this.logger.warn('WhatsApp sender not available, skipping reminders');
      return;
    }

    await this.send30MinReminders();
    await this.checkMissedAppointments();
  }

  private async send30MinReminders() {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 25 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 35 * 60 * 1000);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        status: 'SCHEDULED',
        startTime: { gte: windowStart, lte: windowEnd },
      },
      include: {
        patient: { select: { id: true, name: true, phone: true } },
        doctor: { select: { name: true } },
      },
    });

    for (const apt of appointments) {
      if (!apt.patient?.phone || !apt.startTime) continue;

      const phone = apt.patient.phone;
      const patientName = apt.patient.name;
      const doctorName = apt.doctor.name;
      const startTime = new Date(apt.startTime);
      const reminderKey = `${this.REMINDER_KEY}${apt.id}`;

      if (this.redis) {
        const exists = await this.redis.get(reminderKey);
        if (exists) continue;
      }

      const timeStr = startTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      const dateStr = startTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

      await this.whatsappSender!.sendText(phone,
        `⏰ *Appointment Reminder*\n\n` +
        `Hi ${patientName}! Your appointment is in *30 minutes*.\n\n` +
        `📅 ${dateStr} at ${timeStr}\n` +
        `🩺 Dr. ${doctorName}\n` +
        `🔢 Queue: #${apt.queueNumber}\n\n` +
        `Please arrive 10 minutes early. See you soon! 😊`,
      );

      if (this.redis) {
        await this.redis.set(reminderKey, '1', 'EX', 3600);
      }

      this.logger.log(`Sent 30-min reminder for appointment ${apt.id} to ${phone}`);
    }
  }

  private async checkMissedAppointments() {
    const now = new Date();
    const windowStart = new Date(now.getTime() - 20 * 60 * 1000);
    const windowEnd = new Date(now.getTime() - 10 * 60 * 1000);

    const missedAppointments = await this.prisma.appointment.findMany({
      where: {
        status: 'SCHEDULED',
        startTime: { gte: windowStart, lte: windowEnd },
      },
      include: {
        patient: { select: { id: true, name: true, phone: true } },
        doctor: { select: { name: true } },
      },
    });

    for (const apt of missedAppointments) {
      if (!apt.patient?.phone || !apt.startTime) continue;

      const phone = apt.patient.phone;
      const patientName = apt.patient.name;
      const doctorName = apt.doctor.name;
      const startTime = new Date(apt.startTime);
      const missedKey = `${this.MISSED_KEY}${apt.id}`;

      if (this.redis) {
        const exists = await this.redis.get(missedKey);
        if (exists) continue;
      }

      await this.prisma.appointment.update({
        where: { id: apt.id },
        data: { status: 'MISSED' },
      });

      const timeStr = startTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      const dateStr = startTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

      await this.whatsappSender!.sendButtons(phone,
        `😟 *Appointment Missed*\n\n` +
        `Hi ${patientName}, we missed you today!\n\n` +
        `📅 ${dateStr} at ${timeStr}\n` +
        `🩺 Dr. ${doctorName}\n\n` +
        `Would you like to reschedule?`,
        [
          { id: `reschedule_${apt.id}_yes`, title: '✅ Yes, reschedule' },
          { id: `reschedule_${apt.id}_no`, title: '❌ No, thanks' },
        ],
      );

      if (this.redis) {
        await this.redis.set(missedKey, '1', 'EX', 86400);
      }

      this.logger.log(`Marked appointment ${apt.id} as MISSED and sent message to ${phone}`);
    }
  }

  async handleRescheduleReply(appointmentId: string, reply: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true, doctor: true },
    });

    if (!appointment || !appointment.patient?.phone) {
      return;
    }

    if (reply.includes('yes') || reply === `reschedule_${appointmentId}_yes`) {
      await this.prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'CANCELLED' },
      });

      await this.whatsappSender?.sendText(appointment.patient.phone,
        `📋 To reschedule, please share your *preferred date* (e.g., tomorrow, next Monday) or I can show you available slots.\n\n` +
        `Type *menu* to see available options.`,
      );
    } else {
      await this.whatsappSender?.sendText(appointment.patient.phone,
        `No problem! If you need to book again in the future, just type *menu*.\n\n` +
        `Take care! 😊`,
      );
    }
  }
}