import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SlotLockService } from '../slot-lock/slot-lock.service';
import { PriorityQueueService } from '../appointment/priority-queue.service';
import { CacheService } from '../common/cache.service';

export interface SlotOption {
  id: string;
  label: string;
  startTime: string;
  date: string;
}

export interface BookingResult {
  appointmentId: string;
  queueNumber: number;
  doctorName: string;
  date: string;
  time: string;
}

@Injectable()
export class AppointmentWorkflowService {
  private readonly logger = new Logger(AppointmentWorkflowService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly slotLock: SlotLockService,
    private readonly priorityQueue: PriorityQueueService,
    private readonly cache: CacheService,
  ) {}

  async searchPatient(query: string): Promise<Array<{ id: string; name: string; patientId: string; phone: string | null }>> {
    const cleaned = query.replace(/[\s\-\+91]/g, '').replace(/^0/, '');

    const isPhoneQuery = /^\d{10}$/.test(cleaned);

    if (isPhoneQuery) {
      const patients = await this.prisma.patient.findMany({
        where: { 
          isArchived: false,
          OR: [
            { phone: cleaned },
            { phone: { endsWith: cleaned } },
          ],
        },
        take: 5,
        select: { id: true, name: true, patientId: true, phone: true },
      });
      return patients;
    }

    const patients = await this.prisma.patient.findMany({
      where: {
        isArchived: false,
        OR: [
          { patientId: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5,
      select: { id: true, name: true, patientId: true, phone: true },
    });

    return patients;
  }

  async createPatient(name: string, phone: string): Promise<{ id: string; name: string; patientId: string }> {
    const cleanedPhone = phone.replace(/[\s\-\+]/g, '').replace(/^0/, '');
    
    if (!/^[6-9]\d{9}$/.test(cleanedPhone)) {
      throw new ConflictException('Invalid phone number. Please provide a valid 10-digit Indian mobile number.');
    }

    const existingPatient = await this.prisma.patient.findFirst({
      where: { phone: cleanedPhone, isArchived: false },
    });
    if (existingPatient) {
      throw new ConflictException('A patient with this phone number already exists. Please provide a different number.');
    }

    const year = new Date().getFullYear();
    const lastPatient = await this.prisma.patient.findFirst({
      where: { patientId: { startsWith: `DF-${year}` } },
      orderBy: { patientId: 'desc' },
      select: { patientId: true },
    });

    let nextNum = 1;
    if (lastPatient) {
      const parts = lastPatient.patientId.split('-');
      nextNum = parseInt(parts[2] || '0') + 1;
    }

    const patientId = `DF-${year}-${String(nextNum).padStart(4, '0')}`;

    const patient = await this.prisma.patient.create({
      data: { patientId, name: name.trim(), phone: cleanedPhone },
      select: { id: true, name: true, patientId: true },
    });

    this.logger.log(`New patient created via WhatsApp: ${patient.name} (${patient.patientId})`);
    return patient;
  }

  async getAvailableDoctors(): Promise<Array<{ id: string; name: string }>> {
    this.logger.debug('getAvailableDoctors called');
    try {
      const doctors = await this.prisma.user.findMany({
        where: { role: 'DOCTOR', isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      });
      this.logger.debug(`Found ${doctors.length} doctors: ${JSON.stringify(doctors)}`);
      return doctors;
    } catch (error) {
      this.logger.error(`Error fetching doctors: ${error.message}`);
      return [];
    }
  }

  async getAvailableSlots(doctorId: string, daysAhead: number = 3): Promise<SlotOption[]> {
    this.logger.debug(`getAvailableSlots called for doctor: ${doctorId}, daysAhead: ${daysAhead}`);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + daysAhead);

    const slots = await this.prisma.appointmentSlot.findMany({
      where: {
        doctorId,
        isAvailable: true,
        date: { gte: today, lte: endDate },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      take: 10,
    });
    
    this.logger.debug(`Found ${slots.length} available slots in DB`);

    const result: SlotOption[] = [];
    for (const slot of slots) {
      const dateStr = slot.date.toISOString().split('T')[0];

      const existing = await this.prisma.appointment.findFirst({
        where: {
          doctorId,
          date: slot.date,
          startTime: new Date(`${dateStr}T${slot.startTime}:00`),
          status: { notIn: ['CANCELLED', 'MISSED'] },
        },
      });

      const slotKey = `${doctorId}_${new Date(`${dateStr}T${slot.startTime}:00`).getTime()}`;
      const locked = await this.slotLock.isLocked(slotKey);

      if (!existing && !locked) {
        result.push({
          id: slot.id,
          label: `${this.formatDate(slot.date)} ${slot.startTime}–${slot.endTime}`,
          startTime: slot.startTime,
          date: dateStr,
        });
      }
    }

    return result;
  }

  async bookAppointment(patientId: string, doctorId: string, slotId: string): Promise<BookingResult> {
    const slot = await this.prisma.appointmentSlot.findUnique({ where: { id: slotId } });
    if (!slot) throw new Error('Slot no longer available');

    const dateStr = slot.date.toISOString().split('T')[0];
    const startTime = new Date(`${dateStr}T${slot.startTime}:00`);
    const slotKey = `${doctorId}_${startTime.getTime()}`;

    const locked = await this.slotLock.acquireLock(slotKey, patientId, 300000);
    if (!locked) throw new Error('This slot was just taken. Please choose another.');

    try {
      const dateStart = new Date(dateStr);
      dateStart.setUTCHours(0, 0, 0, 0);
      const dateEnd = new Date(dateStart);
      dateEnd.setUTCHours(23, 59, 59, 999);

      const lastQueue = await this.prisma.appointment.findFirst({
        where: { date: { gte: dateStart, lte: dateEnd }, doctorId },
        orderBy: { queueNumber: 'desc' },
        select: { queueNumber: true },
      });

      const queueNumber = (lastQueue?.queueNumber || 0) + 1;

      const existingAppt = await this.prisma.appointment.findFirst({
        where: {
          doctorId,
          startTime,
          status: { notIn: ['CANCELLED', 'MISSED'] },
        },
      });
      if (existingAppt) {
        throw new Error('This slot has already been booked. Please choose another.');
      }

      const appointment = await this.prisma.appointment.create({
        data: {
          patientId,
          doctorId,
          date: new Date(dateStr),
          startTime,
          endTime: slot.endTime ? new Date(`${dateStr}T${slot.endTime}:00`) : undefined,
          type: 'Consultation',
          queueNumber,
          metadata: { source: 'whatsapp' },
        },
        include: {
          doctor: { select: { name: true } },
          patient: { select: { name: true } },
        },
      });

      await this.prisma.appointmentSlot.update({
        where: { id: slotId },
        data: { isAvailable: false },
      });

      await this.slotLock.releaseLock(slotKey, patientId);

      const timestamp = startTime.getTime();
      await this.priorityQueue.enqueue(appointment.id, doctorId, dateStr, timestamp, false);
      await this.cache.invalidate('appointments:list:');
      await this.cache.invalidate('appointments:queue:');

      this.logger.log(`✅ WhatsApp booking: ${appointment.patient.name} → Dr. ${appointment.doctor.name} Q#${queueNumber}`);

      return {
        appointmentId: appointment.id,
        queueNumber,
        doctorName: appointment.doctor.name,
        date: this.formatDate(new Date(dateStr)),
        time: slot.startTime,
      };
    } catch (error) {
      await this.slotLock.releaseLock(slotKey, patientId);
      throw error;
    }
  }

  async getUpcomingAppointments(patientId: string): Promise<Array<{ id: string; date: string; time: string; doctorName: string }>> {
    const now = new Date();
    const appointments = await this.prisma.appointment.findMany({
      where: { patientId, date: { gte: now }, status: 'SCHEDULED' },
      orderBy: { date: 'asc' },
      include: { doctor: { select: { name: true } } },
      take: 5,
    });

    return appointments.map((a) => ({
      id: a.id,
      date: this.formatDate(a.date),
      time: a.startTime.toISOString().split('T')[1]?.slice(0, 5) || '',
      doctorName: a.doctor.name,
    }));
  }

  async cancelAppointment(appointmentId: string): Promise<void> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });
    
    if (!appointment) {
      throw new Error('Appointment not found');
    }
    
    if (appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED') {
      throw new Error('Cannot cancel this appointment');
    }

    await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'CANCELLED' },
    });
    await this.cache.invalidate('appointments:list:');
    await this.cache.invalidate('appointments:queue:');
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short',
    });
  }
}