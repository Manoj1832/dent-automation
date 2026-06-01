import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTreatmentDto, UpdateTreatmentDto, QueryTreatmentDto } from './dto';

@Injectable()
export class TreatmentService {
  private readonly logger = new Logger(TreatmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTreatmentDto) {
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

    if (dto.plannedProcedureId) {
      const procedure = await this.prisma.plannedProcedure.findUnique({
        where: { id: dto.plannedProcedureId },
      });
      if (!procedure) {
        throw new NotFoundException('Planned procedure not found');
      }
    }

    if (dto.treatmentPlanId) {
      const plan = await this.prisma.treatmentPlan.findUnique({
        where: { id: dto.treatmentPlanId },
      });
      if (!plan) {
        throw new NotFoundException('Treatment plan not found');
      }
    }

    if (dto.cost !== undefined && dto.cost < 0) {
      throw new BadRequestException('Cost cannot be negative');
    }

    const visitDate = dto.visitDate ? new Date(dto.visitDate) : new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (visitDate < today) {
      throw new BadRequestException('Visit date cannot be in the past');
    }

    const treatment = await this.prisma.treatment.create({
      data: {
        visitDate,
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        plannedProcedureId: dto.plannedProcedureId,
        treatmentPlanId: dto.treatmentPlanId,
        procedureNotes: dto.procedureNotes?.trim(),
        medicationsGiven: dto.medicationsGiven?.trim(),
        sutureDetails: dto.sutureDetails as any,
        followUpNotes: dto.followUpNotes?.trim(),
        procedure: dto.procedure?.trim(),
        toothNumbers: dto.toothNumbers || [],
        prescription: dto.prescription?.trim(),
        cost: dto.cost,
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : undefined,
        appointmentId: dto.appointmentId,
        metadata: dto.metadata ? (dto.metadata as any) : {},
      },
      include: {
        patient: { select: { id: true, patientId: true, name: true } },
        doctor: { select: { id: true, name: true } },
        plannedProcedure: true,
        treatmentPlan: true,
      },
    });

    this.logger.log(`Treatment created for patient: ${treatment.patient.name} on ${visitDate.toISOString()}`);
    return treatment;
  }

  async findAll(dto: QueryTreatmentDto) {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (dto.patientId) where.patientId = dto.patientId;
    if (dto.doctorId) where.doctorId = dto.doctorId;
    if (dto.search) {
      where.OR = [
        { procedure: { contains: dto.search, mode: 'insensitive' } },
        { procedureNotes: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    const [treatments, total] = await Promise.all([
      this.prisma.treatment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { select: { id: true, patientId: true, name: true } },
          doctor: { select: { id: true, name: true } },
          _count: { select: { files: true } },
        },
      }),
      this.prisma.treatment.count({ where }),
    ]);

    return {
      treatments,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const treatment = await this.prisma.treatment.findUnique({
      where: { id },
      include: {
        patient: { select: { id: true, patientId: true, name: true, phone: true } },
        doctor: { select: { id: true, name: true } },
        appointment: { select: { id: true, date: true, type: true } },
        plannedProcedure: true,
        treatmentPlan: true,
        files: true,
      },
    });

    if (!treatment) {
      throw new NotFoundException('Treatment not found');
    }

    return treatment;
  }

  async update(id: string, dto: UpdateTreatmentDto) {
    const existing = await this.findOne(id);

    if (dto.doctorId && dto.doctorId !== existing.doctorId) {
      const doctor = await this.prisma.user.findUnique({ where: { id: dto.doctorId } });
      if (!doctor || doctor.role !== 'DOCTOR') {
        throw new NotFoundException('Doctor not found or invalid');
      }
    }

    if (dto.cost !== undefined && dto.cost < 0) {
      throw new BadRequestException('Cost cannot be negative');
    }

    return this.prisma.treatment.update({
      where: { id },
      data: {
        visitDate: dto.visitDate ? new Date(dto.visitDate) : undefined,
        procedureNotes: dto.procedureNotes?.trim(),
        medicationsGiven: dto.medicationsGiven?.trim(),
        sutureDetails: dto.sutureDetails as any,
        followUpNotes: dto.followUpNotes?.trim(),
        procedure: dto.procedure?.trim(),
        toothNumbers: dto.toothNumbers,
        prescription: dto.prescription?.trim(),
        cost: dto.cost,
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : undefined,
        metadata: dto.metadata ? (dto.metadata as any) : undefined,
      },
      include: {
        patient: { select: { id: true, patientId: true, name: true } },
        doctor: { select: { id: true, name: true } },
        plannedProcedure: true,
        treatmentPlan: true,
      },
    });
  }

  async getPatientHistory(patientId: string) {
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return this.prisma.treatment.findMany({
      where: { patientId },
      orderBy: { visitDate: 'desc' },
      include: {
        doctor: { select: { name: true } },
        files: true,
        appointment: { select: { date: true, type: true } },
        plannedProcedure: true,
        treatmentPlan: true,
      },
    });
  }

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [total, todayCount, totalRevenue] = await Promise.all([
      this.prisma.treatment.count(),
      this.prisma.treatment.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
      this.prisma.treatment.aggregate({ _sum: { cost: true } }),
    ]);

    return {
      total,
      todayCount,
      totalRevenue: totalRevenue._sum.cost || 0,
    };
  }
}