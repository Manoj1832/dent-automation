import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateTreatmentPlanDto,
  UpdateTreatmentPlanDto,
  UpdatePlannedProcedureDto,
} from './dto';

@Injectable()
export class TreatmentPlanService {
  private readonly logger = new Logger(TreatmentPlanService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTreatmentPlanDto) {
    const plannedAt = dto.plannedAt ? new Date(dto.plannedAt) : new Date();

    let procedures: any[] = [];
    if (dto.procedures && dto.procedures.length > 0) {
      procedures = dto.procedures.map((p) => ({
        procedureType: p.procedureType,
        toothNumbers: p.toothNumbers || [],
        material: p.material,
        typeDetail: p.typeDetail,
        estimatedCost: p.estimatedCost,
        status: p.status || 'PLANNED',
        notes: p.notes,
      }));
    }

    const treatmentPlan = await this.prisma.treatmentPlan.create({
      data: {
        patientId: dto.patientId,
        plannedAt,
        plannedById: dto.plannedById,
        appointmentId: dto.appointmentId,
        status: dto.status || 'PLANNED',
        preOpPhoto: dto.preOpPhoto || false,
        preOpModel: dto.preOpModel || false,
        estimatedTotal: dto.estimatedTotal,
        discountAmount: dto.discountAmount,
        notes: dto.notes,
        procedures: {
          create: procedures,
        },
      },
      include: {
        plannedBy: { select: { id: true, name: true } },
        procedures: true,
        patient: { select: { id: true, patientId: true, name: true } },
      },
    });

    this.logger.log(`Treatment plan created for patient: ${dto.patientId}`);
    return treatmentPlan;
  }

  async findByPatientId(patientId: string) {
    return this.prisma.treatmentPlan.findMany({
      where: { patientId },
      orderBy: { plannedAt: 'desc' },
      include: {
        plannedBy: { select: { id: true, name: true } },
        procedures: true,
      },
    });
  }

  async findOne(id: string) {
    const treatmentPlan = await this.prisma.treatmentPlan.findUnique({
      where: { id },
      include: {
        plannedBy: { select: { id: true, name: true } },
        procedures: true,
        patient: { select: { id: true, patientId: true, name: true } },
        invoices: true,
        treatments: true,
      },
    });

    if (!treatmentPlan) {
      throw new NotFoundException('Treatment plan not found');
    }

    return treatmentPlan;
  }

  async update(id: string, dto: UpdateTreatmentPlanDto) {
    await this.findOne(id);

    const treatmentPlan = await this.prisma.treatmentPlan.update({
      where: { id },
      data: dto,
      include: {
        plannedBy: { select: { id: true, name: true } },
        procedures: true,
      },
    });

    this.logger.log(`Treatment plan updated: ${id}`);
    return treatmentPlan;
  }

  async updateProcedure(procedureId: string, dto: UpdatePlannedProcedureDto) {
    const procedure = await this.prisma.plannedProcedure.findUnique({
      where: { id: procedureId },
    });

    if (!procedure) {
      throw new NotFoundException('Planned procedure not found');
    }

    const updated = await this.prisma.plannedProcedure.update({
      where: { id: procedureId },
      data: {
        ...dto,
        completedAt: dto.completedAt ? new Date(dto.completedAt) : undefined,
      },
    });

    this.logger.log(`Planned procedure updated: ${procedureId}`);
    return updated;
  }

  async addProcedure(planId: string, procedure: {
    procedureType: any;
    toothNumbers?: number[];
    material?: string;
    typeDetail?: string;
    estimatedCost?: number;
    notes?: string;
  }) {
    const procedureData = await this.prisma.plannedProcedure.create({
      data: {
        treatmentPlanId: planId,
        procedureType: procedure.procedureType,
        toothNumbers: procedure.toothNumbers || [],
        material: procedure.material,
        typeDetail: procedure.typeDetail,
        estimatedCost: procedure.estimatedCost,
        notes: procedure.notes,
        status: 'PLANNED',
      },
    });

    this.logger.log(`Procedure added to treatment plan: ${planId}`);
    return procedureData;
  }

  async delete(id: string) {
    await this.findOne(id);

    await this.prisma.treatmentPlan.delete({
      where: { id },
    });

    this.logger.log(`Treatment plan deleted: ${id}`);
  }
}