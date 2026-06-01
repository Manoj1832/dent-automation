import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsArray,
  IsDateString,
  IsNumber,
} from 'class-validator';

export class CreateTreatmentDto {
  @IsString()
  @IsNotEmpty()
  patientId!: string;

  @IsString()
  @IsNotEmpty()
  doctorId!: string;

  @IsDateString()
  @IsOptional()
  visitDate?: string;

  @IsString()
  @IsOptional()
  plannedProcedureId?: string;

  @IsString()
  @IsOptional()
  treatmentPlanId?: string;

  @IsString()
  @IsOptional()
  procedureNotes?: string;

  @IsString()
  @IsOptional()
  medicationsGiven?: string;

  @IsOptional()
  sutureDetails?: Record<string, unknown>;

  @IsString()
  @IsOptional()
  followUpNotes?: string;

  // Legacy fields
  @IsString()
  @IsOptional()
  procedure?: string;

  @IsArray()
  @IsOptional()
  toothNumbers?: number[];

  @IsString()
  @IsOptional()
  prescription?: string;

  @IsNumber()
  @IsOptional()
  cost?: number;

  @IsDateString()
  @IsOptional()
  followUpDate?: string;

  @IsString()
  @IsOptional()
  appointmentId?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class UpdateTreatmentDto {
  @IsString()
  @IsOptional()
  doctorId?: string;

  @IsDateString()
  @IsOptional()
  visitDate?: string;

  @IsString()
  @IsOptional()
  procedureNotes?: string;

  @IsString()
  @IsOptional()
  medicationsGiven?: string;

  @IsOptional()
  sutureDetails?: Record<string, unknown>;

  @IsString()
  @IsOptional()
  followUpNotes?: string;

  // Legacy fields
  @IsString()
  @IsOptional()
  procedure?: string;

  @IsArray()
  @IsOptional()
  toothNumbers?: number[];

  @IsString()
  @IsOptional()
  prescription?: string;

  @IsNumber()
  @IsOptional()
  cost?: number;

  @IsDateString()
  @IsOptional()
  followUpDate?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class QueryTreatmentDto {
  @IsString()
  @IsOptional()
  patientId?: string;

  @IsString()
  @IsOptional()
  doctorId?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsInt()
  @IsOptional()
  page?: number;

  @IsInt()
  @IsOptional()
  limit?: number;
}