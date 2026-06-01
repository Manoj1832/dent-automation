import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LabCaseStatus } from '@prisma/client';

@Injectable()
export class LabCasesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.labCase.findMany({
      include: {
        patient: { select: { name: true, patientId: true } },
        doctor: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: {
    labName: string;
    caseType: string;
    toothNumbers?: number[];
    instructions?: string;
    expectedDate?: string;
    patientId: string;
    doctorId: string;
  }) {
    return this.prisma.labCase.create({
      data: {
        labName: data.labName,
        caseType: data.caseType,
        toothNumbers: data.toothNumbers || [],
        instructions: data.instructions,
        expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
        patientId: data.patientId,
        doctorId: data.doctorId,
        status: 'SENT',
      },
      include: {
        patient: { select: { name: true, patientId: true } },
        doctor: { select: { name: true } },
      }
    });
  }

  async updateStatus(id: string, status: LabCaseStatus) {
    const labCase = await this.prisma.labCase.findUnique({ where: { id } });
    if (!labCase) throw new NotFoundException('Lab case not found');

    const updateData: any = { status };
    if (status === 'DELIVERED' && !labCase.deliveryDate) {
      updateData.deliveryDate = new Date();
    }

    return this.prisma.labCase.update({
      where: { id },
      data: updateData,
      include: {
        patient: { select: { name: true, patientId: true } },
        doctor: { select: { name: true } },
      }
    });
  }
}
