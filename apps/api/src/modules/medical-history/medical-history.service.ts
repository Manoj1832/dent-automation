import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMedicalHistoryDto, UpdateMedicalHistoryDto } from './dto';

@Injectable()
export class MedicalHistoryService {
  private readonly logger = new Logger(MedicalHistoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMedicalHistoryDto) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId },
    });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const existing = await this.prisma.medicalHistory.findUnique({
      where: { patientId: dto.patientId },
    });
    if (existing) {
      await this.prisma.medicalHistory.update({
        where: { patientId: dto.patientId },
        data: {
          diabetic: dto.diabetic || false,
          hypertension: dto.hypertension || false,
          hepatic: dto.hepatic || false,
          cardioVascular: dto.cardioVascular || false,
          pregnancy: dto.pregnancy || false,
          pregnancyTrimester: dto.pregnancyTrimester,
          thyroid: dto.thyroid || false,
          ulcer: dto.ulcer || false,
          drugAllergy: dto.drugAllergy || false,
          drugAllergyDetail: dto.drugAllergyDetail?.trim(),
          bleedingDisorder: dto.bleedingDisorder || false,
          lactatingMother: dto.lactatingMother || false,
          neural: dto.neural || false,
          renal: dto.renal || false,
          previousCovid19: dto.previousCovid19 || false,
          hypercholesterolemia: dto.hypercholesterolemia || false,
          otherSpecify: dto.otherSpecify?.trim(),
        },
      });
      this.logger.log(`Medical history updated for patient: ${dto.patientId}`);
      return this.prisma.medicalHistory.findUnique({ where: { patientId: dto.patientId } });
    }

    const medicalHistory = await this.prisma.medicalHistory.create({
      data: {
        patientId: dto.patientId,
        diabetic: dto.diabetic || false,
        hypertension: dto.hypertension || false,
        hepatic: dto.hepatic || false,
        cardioVascular: dto.cardioVascular || false,
        pregnancy: dto.pregnancy || false,
        pregnancyTrimester: dto.pregnancyTrimester,
        thyroid: dto.thyroid || false,
        ulcer: dto.ulcer || false,
        drugAllergy: dto.drugAllergy || false,
        drugAllergyDetail: dto.drugAllergyDetail?.trim(),
        bleedingDisorder: dto.bleedingDisorder || false,
        lactatingMother: dto.lactatingMother || false,
        neural: dto.neural || false,
        renal: dto.renal || false,
        previousCovid19: dto.previousCovid19 || false,
        hypercholesterolemia: dto.hypercholesterolemia || false,
        otherSpecify: dto.otherSpecify?.trim(),
      },
    });

    this.logger.log(`Medical history created for patient: ${dto.patientId}`);
    return medicalHistory;
  }

  async findByPatientId(patientId: string) {
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const medicalHistory = await this.prisma.medicalHistory.findUnique({
      where: { patientId },
    });

    if (!medicalHistory) {
      throw new NotFoundException('Medical history not found for patient');
    }

    return medicalHistory;
  }

  async update(patientId: string, dto: UpdateMedicalHistoryDto) {
    await this.findByPatientId(patientId);

    const medicalHistory = await this.prisma.medicalHistory.update({
      where: { patientId },
      data: {
        diabetic: dto.diabetic,
        hypertension: dto.hypertension,
        hepatic: dto.hepatic,
        cardioVascular: dto.cardioVascular,
        pregnancy: dto.pregnancy,
        pregnancyTrimester: dto.pregnancyTrimester,
        thyroid: dto.thyroid,
        ulcer: dto.ulcer,
        drugAllergy: dto.drugAllergy,
        drugAllergyDetail: dto.drugAllergyDetail?.trim(),
        bleedingDisorder: dto.bleedingDisorder,
        lactatingMother: dto.lactatingMother,
        neural: dto.neural,
        renal: dto.renal,
        previousCovid19: dto.previousCovid19,
        hypercholesterolemia: dto.hypercholesterolemia,
        otherSpecify: dto.otherSpecify?.trim(),
      },
    });

    this.logger.log(`Medical history updated for patient: ${patientId}`);
    return medicalHistory;
  }

  async delete(patientId: string) {
    await this.findByPatientId(patientId);

    await this.prisma.medicalHistory.delete({
      where: { patientId },
    });

    this.logger.log(`Medical history deleted for patient: ${patientId}`);
  }
}