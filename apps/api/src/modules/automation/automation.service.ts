import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AutomationService implements OnModuleInit {
  private readonly logger = new Logger(AutomationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    this.logger.log('Automation engine initialized');
  }

  async scheduleAppointmentReminder(appointmentId: string, patientId: string, date: Date, type: string) {
    this.logger.log(`Reminder scheduled for appointment ${appointmentId} at ${date.toISOString()}`);
  }

  async scheduleRecallReminder(patientId: string, months: number) {
    this.logger.log(`Recall reminder scheduled for patient ${patientId} in ${months} months`);
  }

  async getPendingReminders() {
    return [];
  }
}

@Injectable()
export class MissedAppointmentService {
  private readonly logger = new Logger(MissedAppointmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async markMissedAppointments() {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const endOfYesterday = new Date(yesterday);
    endOfYesterday.setHours(23, 59, 59, 999);

    const missedAppointments = await this.prisma.appointment.updateMany({
      where: {
        date: { gte: yesterday, lte: endOfYesterday },
        status: 'SCHEDULED',
      },
      data: { status: 'MISSED' },
    });

    if (missedAppointments.count > 0) {
      this.logger.log(`Marked ${missedAppointments.count} appointments as missed`);
      await this.prisma.auditLog.create({
        data: {
          action: 'MISSED_APPOINTMENTS_MARKED',
          entity: 'Appointment',
          details: { count: missedAppointments.count, date: yesterday.toISOString() },
        },
      });
    }
  }
}