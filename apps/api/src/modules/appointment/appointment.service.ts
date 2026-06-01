import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PerformanceService } from '../common/performance.service';
import { CacheService } from '../common/cache.service';
import { SlotLockService } from '../slot-lock/slot-lock.service';
import { PriorityQueueService } from './priority-queue.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  QueryAppointmentDto,
} from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AppointmentService {
  private readonly logger = new Logger(AppointmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly performance: PerformanceService,
    private readonly cache: CacheService,
    private readonly slotLockService: SlotLockService,
    private readonly priorityQueue: PriorityQueueService,
  ) {}

  async create(dto: CreateAppointmentDto) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const apptDate = new Date(dto.date);
    apptDate.setHours(0, 0, 0, 0);
    
    if (apptDate < now) {
      throw new BadRequestException('Cannot book appointments in the past.');
    }

    const startTimeDate = new Date(dto.startTime);
    const endOfDay = new Date(apptDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    if (startTimeDate > endOfDay) {
      throw new BadRequestException('Appointment time cannot be in the past for the selected date.');
    }

    const [patient, doctor] = await Promise.all([
      this.prisma.patient.findUnique({ where: { id: dto.patientId } }),
      this.prisma.user.findUnique({ where: { id: dto.doctorId } }),
    ]);

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }
    if (!doctor || doctor.role !== 'DOCTOR') {
      throw new NotFoundException('Doctor not found or invalid');
    }

    const duplicateAppt = await this.prisma.appointment.findFirst({
      where: {
        patientId: dto.patientId,
        date: apptDate,
        status: { notIn: ['CANCELLED', 'MISSED'] },
      },
    });
    if (duplicateAppt) {
      throw new ConflictException('Patient already has an appointment for this date');
    }

    const slotKey = `${dto.doctorId}_${startTimeDate.getTime()}`;
    const lockAcquired = await this.slotLockService.acquireLock(slotKey, dto.patientId, 5000);
    
    if (!lockAcquired) {
      throw new ConflictException('This slot is currently being booked by another patient. Please try another slot.');
    }

    try {
      const dateStart = new Date(dto.date);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(dateStart);
      dateEnd.setHours(23, 59, 59, 999);

      const lastQueue = await this.prisma.appointment.findFirst({
        where: {
          date: { gte: dateStart, lte: dateEnd },
          doctorId: dto.doctorId,
        },
        orderBy: { queueNumber: 'desc' },
        select: { queueNumber: true },
      });

      const queueNumber = (lastQueue?.queueNumber || 0) + 1;

      const existingAppt = await this.prisma.appointment.findFirst({
        where: { 
          doctorId: dto.doctorId, 
          startTime: startTimeDate, 
          status: { notIn: ['CANCELLED', 'MISSED'] } 
        }
      });

      if (existingAppt) {
        throw new ConflictException('This slot has already been booked.');
      }

      const appointment = await this.prisma.appointment.create({
        data: {
          patientId: dto.patientId,
          doctorId: dto.doctorId,
          date: apptDate,
          startTime: startTimeDate,
          endTime: dto.endTime ? new Date(dto.endTime) : undefined,
          type: dto.type?.trim() || 'Consultation',
          notes: dto.notes?.trim(),
          queueNumber,
        },
        include: {
          patient: { select: { id: true, patientId: true, name: true, phone: true } },
          doctor: { select: { id: true, name: true } },
        },
      });

      this.logger.log(
        `Appointment created: ${appointment.patient.name} → Dr. ${appointment.doctor.name} (Q#${queueNumber})`,
      );

      const dateStr = apptDate.toISOString().split('T')[0];
      const timestamp = startTimeDate.getTime();
      const isEmergency = dto.type?.toLowerCase() === 'emergency';
      await this.priorityQueue.enqueue(appointment.id, dto.doctorId, dateStr, timestamp, isEmergency);

      await this.cache.invalidate('appointments:list:');
      await this.cache.invalidate('appointments:queue:');
      await this.cache.invalidate('appointments:stats');

      return appointment;
    } finally {
      await this.slotLockService.releaseLock(slotKey, dto.patientId);
    }
  }

  async findAll(dto: QueryAppointmentDto) {
    const page = dto.page || 1;
    const limit = dto.limit || 50;
    const skip = (page - 1) * limit;
    const cacheKey = `appointments:list:${dto.date || 'all'}:${dto.doctorId || 'all'}:${dto.status || 'all'}:${dto.query || ''}:p${page}:l${limit}`;

    return this.cache.remember(cacheKey, 20, async () => {
      const where: Prisma.AppointmentWhereInput = {};

      if (dto.date) {
        const dateStart = new Date(dto.date);
        dateStart.setUTCHours(0, 0, 0, 0);
        const dateEnd = new Date(dateStart);
        dateEnd.setUTCHours(23, 59, 59, 999);
        where.date = { gte: dateStart, lte: dateEnd };
      }

      if (dto.doctorId) where.doctorId = dto.doctorId;
      if (dto.status) where.status = dto.status;
      if (dto.query) {
        where.patient = {
          name: { contains: dto.query, mode: 'insensitive' },
        };
      }

      const [appointments, total] = await Promise.all([
        this.performance.explainQuery('appointment.findAll', () =>
          this.prisma.appointment.findMany({
            where,
            skip,
            take: limit,
            orderBy: [{ date: 'asc' }, { queueNumber: 'asc' }],
            include: {
              patient: { select: { id: true, patientId: true, name: true, phone: true } },
              doctor: { select: { id: true, name: true } },
            },
          }),
        ),
        this.performance.explainQuery('appointment.count', () =>
          this.prisma.appointment.count({ where }),
        ),
      ]);

      return {
        appointments,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      };
    });
  }

  async findOne(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: { select: { id: true, name: true, email: true } },
        treatments: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return appointment;
  }

  async update(id: string, dto: UpdateAppointmentDto) {
    const existing = await this.findOne(id);

    if (dto.doctorId && dto.doctorId !== existing.doctorId) {
      const doctor = await this.prisma.user.findUnique({ where: { id: dto.doctorId } });
      if (!doctor || doctor.role !== 'DOCTOR') {
        throw new NotFoundException('Doctor not found or invalid');
      }
    }

    const data: Prisma.AppointmentUpdateInput = {};
    if (dto.status) {
      if (dto.status === 'COMPLETED' && existing.status !== 'COMPLETED') {
        (data as any).completedAt = new Date();
      }
      data.status = dto.status;
    }
    if (dto.date) data.date = new Date(dto.date);
    if (dto.startTime) data.startTime = new Date(dto.startTime);
    if (dto.endTime) data.endTime = new Date(dto.endTime);
    if (dto.doctorId) data.doctor = { connect: { id: dto.doctorId } };
    if (dto.type) data.type = dto.type.trim();
    if (dto.notes !== undefined) data.notes = dto.notes?.trim();
    if (dto.queueNumber) data.queueNumber = dto.queueNumber;

    const updated = await this.prisma.appointment.update({
      where: { id },
      data,
      include: {
        patient: { select: { id: true, patientId: true, name: true } },
        doctor: { select: { id: true, name: true } },
      },
    });

    await this.cache.invalidate('appointments:list:');
    await this.cache.invalidate('appointments:queue:');
    await this.cache.invalidate('appointments:stats');
    return updated;
  }

  async getTodayQueue(doctorId?: string, queryDate?: string) {
    if (doctorId && !queryDate) {
      const queueIds = await this.priorityQueue.getQueue(doctorId);
      
      if (queueIds.length > 0) {
        const appointments = await this.prisma.appointment.findMany({
          where: { id: { in: queueIds } },
          include: {
            patient: { select: { id: true, patientId: true, name: true, phone: true } },
            doctor: { select: { id: true, name: true } },
          },
        });

        return queueIds
          .map((id) => appointments.find((a) => a.id === id))
          .filter(Boolean);
      }
    }

    const todayStr = queryDate || new Date().toISOString().split('T')[0];
    const today = new Date(`${todayStr}T00:00:00.000Z`);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const where: Prisma.AppointmentWhereInput = {
      date: { gte: today, lt: tomorrow },
      status: { notIn: ['COMPLETED', 'MISSED', 'CANCELLED'] }
    };
    if (doctorId) where.doctorId = doctorId;

    return this.prisma.appointment.findMany({
      where,
      orderBy: { queueNumber: 'asc' },
      include: {
        patient: { select: { id: true, patientId: true, name: true, phone: true } },
        doctor: { select: { id: true, name: true } },
      },
    });
  }

  async getStats() {
    return this.cache.remember('appointments:stats', 60, async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const today = new Date(`${todayStr}T00:00:00.000Z`);
      const tomorrow = new Date(today);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

      const [todayCount, scheduled, completed, missed] = await Promise.all([
        this.prisma.appointment.count({
          where: { date: { gte: today, lt: tomorrow } },
        }),
        this.prisma.appointment.count({ where: { status: 'SCHEDULED' } }),
        this.prisma.appointment.count({
          where: { status: 'COMPLETED', date: { gte: today, lt: tomorrow } },
        }),
        this.prisma.appointment.count({
          where: { status: 'MISSED', date: { gte: today, lt: tomorrow } },
        }),
      ]);

      return { todayCount, scheduled, completedToday: completed, missedToday: missed };
    });
  }
}