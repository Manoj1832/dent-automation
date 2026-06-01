import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsEnum,
  IsDateString,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { ProcedureType, PlannedProcedureStatus, TreatmentPlanStatus } from '@prisma/client';

export class CreateTreatmentPlanDto {
  @IsString()
  @IsNotEmpty()
  patientId!: string;

  @IsDateString()
  @IsOptional()
  plannedAt?: string;

  @IsString()
  @IsOptional()
  plannedById?: string;

  @IsString()
  @IsOptional()
  appointmentId?: string;

  @IsEnum(TreatmentPlanStatus)
  @IsOptional()
  status?: TreatmentPlanStatus;

  @IsBoolean()
  @IsOptional()
  preOpPhoto?: boolean;

  @IsBoolean()
  @IsOptional()
  preOpModel?: boolean;

  @IsNumber()
  @IsOptional()
  estimatedTotal?: number;

  @IsNumber()
  @IsOptional()
  discountAmount?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @IsOptional()
  procedures?: CreatePlannedProcedureDto[];
}

export class CreatePlannedProcedureDto {
  @IsEnum(ProcedureType)
  procedureType!: ProcedureType;

  @IsArray()
  @IsOptional()
  toothNumbers?: number[];

  @IsString()
  @IsOptional()
  material?: string;

  @IsString()
  @IsOptional()
  typeDetail?: string;

  @IsNumber()
  @IsOptional()
  estimatedCost?: number;

  @IsEnum(PlannedProcedureStatus)
  @IsOptional()
  status?: PlannedProcedureStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateTreatmentPlanDto {
  @IsEnum(TreatmentPlanStatus)
  @IsOptional()
  status?: TreatmentPlanStatus;

  @IsBoolean()
  @IsOptional()
  preOpPhoto?: boolean;

  @IsBoolean()
  @IsOptional()
  preOpModel?: boolean;

  @IsNumber()
  @IsOptional()
  estimatedTotal?: number;

  @IsNumber()
  @IsOptional()
  discountAmount?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdatePlannedProcedureDto {
  @IsArray()
  @IsOptional()
  toothNumbers?: number[];

  @IsString()
  @IsOptional()
  material?: string;

  @IsString()
  @IsOptional()
  typeDetail?: string;

  @IsNumber()
  @IsOptional()
  estimatedCost?: number;

  @IsEnum(PlannedProcedureStatus)
  @IsOptional()
  status?: PlannedProcedureStatus;

  @IsDateString()
  @IsOptional()
  completedAt?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}