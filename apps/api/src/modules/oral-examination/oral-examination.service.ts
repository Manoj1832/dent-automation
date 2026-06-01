import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateOralExaminationDto,
  UpdateOralExaminationDto,
} from './dto';

@Injectable()
export class OralExaminationService {
  private readonly logger = new Logger(OralExaminationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOralExaminationDto) {
    const examinedAt = dto.examinedAt ? new Date(dto.examinedAt) : new Date();

    let findings: any[] = [];
    if (dto.findings && dto.findings.length > 0) {
      findings = dto.findings.map((f) => ({
        findingType: f.findingType,
        toothNumbers: f.toothNumbers || [],
        quadrant: f.quadrant,
        detail: f.detail,
        notes: f.notes,
      }));
    }

    const oralExamination = await this.prisma.oralExamination.create({
      data: {
        patientId: dto.patientId,
        examinedAt,
        examinedById: dto.examinedById,
        appointmentId: dto.appointmentId,
        stainCalculus: dto.stainCalculus as any,
        orthoNotes: dto.orthoNotes,
        anyOtherMention: dto.anyOtherMention,
        findings: {
          create: findings,
        },
      },
      include: {
        findings: true,
        examinedBy: { select: { id: true, name: true } },
        patient: { select: { id: true, patientId: true, name: true } },
      },
    });

    this.logger.log(`Oral examination created for patient: ${dto.patientId}`);
    return oralExamination;
  }

  async findByPatientId(patientId: string) {
    return this.prisma.oralExamination.findMany({
      where: { patientId },
      orderBy: { examinedAt: 'desc' },
      include: {
        findings: true,
        examinedBy: { select: { id: true, name: true } },
      },
    });
  }

  async findLatestByPatientId(patientId: string) {
    const oralExamination = await this.prisma.oralExamination.findFirst({
      where: { patientId },
      orderBy: { examinedAt: 'desc' },
      include: {
        findings: true,
        examinedBy: { select: { id: true, name: true } },
        patient: { select: { id: true, patientId: true, name: true } },
      },
    });

    if (!oralExamination) {
      throw new NotFoundException('No oral examination found for patient');
    }

    return oralExamination;
  }

  async findOne(id: string) {
    const oralExamination = await this.prisma.oralExamination.findUnique({
      where: { id },
      include: {
        findings: true,
        examinedBy: { select: { id: true, name: true } },
        patient: { select: { id: true, patientId: true, name: true } },
      },
    });

    if (!oralExamination) {
      throw new NotFoundException('Oral examination not found');
    }

    return oralExamination;
  }

  async update(id: string, dto: UpdateOralExaminationDto) {
    await this.findOne(id);

    const oralExamination = await this.prisma.oralExamination.update({
      where: { id },
      data: {
        stainCalculus: dto.stainCalculus as any,
        orthoNotes: dto.orthoNotes,
        anyOtherMention: dto.anyOtherMention,
      },
      include: {
        findings: true,
        examinedBy: { select: { id: true, name: true } },
      },
    });

    this.logger.log(`Oral examination updated: ${id}`);
    return oralExamination;
  }

  async addFinding(examinationId: string, finding: { findingType: any; toothNumbers?: number[]; quadrant?: any; detail?: string; notes?: string }) {
    const findingData = await this.prisma.oralFinding.create({
      data: {
        oralExaminationId: examinationId,
        findingType: finding.findingType,
        toothNumbers: finding.toothNumbers || [],
        quadrant: finding.quadrant,
        detail: finding.detail,
        notes: finding.notes,
      },
    });

    this.logger.log(`Oral finding added to examination: ${examinationId}`);
    return findingData;
  }

  async delete(id: string) {
    await this.findOne(id);

    await this.prisma.oralExamination.delete({
      where: { id },
    });

    this.logger.log(`Oral examination deleted: ${id}`);
  }
}