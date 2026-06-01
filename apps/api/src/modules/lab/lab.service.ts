import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLabCaseDto, UpdateLabCaseDto, QueryLabCaseDto } from './dto';
import { Prisma, LabCaseStatus } from '@prisma/client';

@Injectable()
export class LabService {
  private readonly logger = new Logger(LabService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLabCaseDto) {
    const [patient, doctor] = await Promise.all([
      this.prisma.patient.findUnique({ where: { id: dto.patientId } }),
      dto.doctorId ? this.prisma.user.findUnique({ where: { id: dto.doctorId } }) : Promise.resolve(null),
    ]);

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }
    if (dto.doctorId && (!doctor || doctor.role !== 'DOCTOR')) {
      throw new NotFoundException('Doctor not found or invalid');
    }

    if (dto.cost !== undefined && dto.cost < 0) {
      throw new BadRequestException('Cost cannot be negative');
    }

    if (dto.expectedDate) {
      const expected = new Date(dto.expectedDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (expected < today) {
        throw new BadRequestException('Expected date cannot be in the past');
      }
    }

    const labCase = await this.prisma.labCase.create({
      data: {
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        labName: dto.labName?.trim(),
        caseType: dto.caseType?.trim(),
        toothNumbers: dto.toothNumbers || [],
        instructions: dto.instructions?.trim(),
        expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : undefined,
        cost: dto.cost,
        notes: dto.notes?.trim(),
        metadata: dto.metadata ? (dto.metadata as any) : {},
      },
      include: {
        patient: { select: { id: true, patientId: true, name: true, phone: true } },
        doctor: { select: { id: true, name: true } },
      },
    });

    this.logger.log(`Lab case created: ${labCase.caseType} for ${labCase.patient.name}`);
    return labCase;
  }

  async findAll(dto: QueryLabCaseDto) {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.LabCaseWhereInput = {};
    if (dto.patientId) where.patientId = dto.patientId;
    if (dto.doctorId) where.doctorId = dto.doctorId;
    if (dto.status) where.status = dto.status;

    const [labCases, total] = await Promise.all([
      this.prisma.labCase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { select: { id: true, patientId: true, name: true, phone: true } },
          doctor: { select: { id: true, name: true } },
        },
      }),
      this.prisma.labCase.count({ where }),
    ]);

    return {
      labCases,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const labCase = await this.prisma.labCase.findUnique({
      where: { id },
      include: {
        patient: { select: { id: true, patientId: true, name: true, phone: true } },
        doctor: { select: { id: true, name: true } },
      },
    });

    if (!labCase) {
      throw new NotFoundException('Lab case not found');
    }

    return labCase;
  }

  async update(id: string, dto: UpdateLabCaseDto) {
    const existing = await this.findOne(id);

    if (dto.status) {
      const validStatuses = ['SENT', 'IN_PROGRESS', 'READY', 'DELIVERED', 'CANCELLED'];
      if (!validStatuses.includes(dto.status)) {
        throw new BadRequestException('Invalid status');
      }
    }

    if (dto.cost !== undefined && dto.cost < 0) {
      throw new BadRequestException('Cost cannot be negative');
    }

    if (dto.doctorId) {
      const doctor = await this.prisma.user.findUnique({ where: { id: dto.doctorId } });
      if (!doctor || doctor.role !== 'DOCTOR') {
        throw new NotFoundException('Doctor not found or invalid');
      }
    }

    const data: Prisma.LabCaseUpdateInput = {};
    if (dto.status) data.status = dto.status;
    if (dto.labName) data.labName = dto.labName.trim();
    if (dto.caseType) data.caseType = dto.caseType.trim();
    if (dto.toothNumbers) data.toothNumbers = dto.toothNumbers;
    if (dto.instructions !== undefined) data.instructions = dto.instructions?.trim();
    if (dto.expectedDate) data.expectedDate = new Date(dto.expectedDate);
    if (dto.deliveryDate) data.deliveryDate = new Date(dto.deliveryDate);
    if (dto.cost !== undefined) data.cost = dto.cost;
    if (dto.notes !== undefined) data.notes = dto.notes?.trim();
    if (dto.metadata) data.metadata = dto.metadata as any;

    const updated = await this.prisma.labCase.update({
      where: { id },
      data,
      include: {
        patient: { select: { id: true, patientId: true, name: true } },
        doctor: { select: { id: true, name: true } },
      },
    });

    this.logger.log(`Lab case updated: ${updated.id} - Status: ${updated.status}`);
    return updated;
  }

  async getStats() {
    const [total, sent, inProgress, ready, delivered] = await Promise.all([
      this.prisma.labCase.count(),
      this.prisma.labCase.count({ where: { status: LabCaseStatus.SENT } }),
      this.prisma.labCase.count({ where: { status: LabCaseStatus.IN_PROGRESS } }),
      this.prisma.labCase.count({ where: { status: LabCaseStatus.READY } }),
      this.prisma.labCase.count({ where: { status: LabCaseStatus.DELIVERED } }),
    ]);

    return { total, sent, inProgress, ready, delivered };
  }
}