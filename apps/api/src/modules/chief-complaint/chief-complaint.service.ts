import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateChiefComplaintDto, UpdateChiefComplaintDto } from './dto';

@Injectable()
export class ChiefComplaintService {
  private readonly logger = new Logger(ChiefComplaintService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateChiefComplaintDto) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId },
    });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const chiefComplaint = await this.prisma.chiefComplaint.create({
      data: {
        patientId: dto.patientId,
        pain: dto.pain || false,
        mobility: dto.mobility || false,
        irregularlyArranged: dto.irregularlyArranged || false,
        bleedingGums: dto.bleedingGums || false,
        decay: dto.decay || false,
        missingTeeth: dto.missingTeeth || false,
        wantsClean: dto.wantsClean || false,
        jaw: dto.jaw,
        side: dto.side,
        region: dto.region,
        toothNumbers: dto.toothNumbers || [],
        notes: dto.notes?.trim(),
      },
    });

    this.logger.log(`Chief complaint created for patient: ${dto.patientId}`);
    return chiefComplaint;
  }

  async findByPatientId(patientId: string) {
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return this.prisma.chiefComplaint.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const chiefComplaint = await this.prisma.chiefComplaint.findUnique({
      where: { id },
    });

    if (!chiefComplaint) {
      throw new NotFoundException('Chief complaint not found');
    }

    return chiefComplaint;
  }

  async update(id: string, dto: UpdateChiefComplaintDto) {
    await this.findOne(id);

    const chiefComplaint = await this.prisma.chiefComplaint.update({
      where: { id },
      data: {
        pain: dto.pain,
        mobility: dto.mobility,
        irregularlyArranged: dto.irregularlyArranged,
        bleedingGums: dto.bleedingGums,
        decay: dto.decay,
        missingTeeth: dto.missingTeeth,
        wantsClean: dto.wantsClean,
        jaw: dto.jaw,
        side: dto.side,
        region: dto.region,
        toothNumbers: dto.toothNumbers,
        notes: dto.notes?.trim(),
      },
    });

    this.logger.log(`Chief complaint updated: ${id}`);
    return chiefComplaint;
  }

  async delete(id: string) {
    await this.findOne(id);

    await this.prisma.chiefComplaint.delete({
      where: { id },
    });

    this.logger.log(`Chief complaint deleted: ${id}`);
  }
}