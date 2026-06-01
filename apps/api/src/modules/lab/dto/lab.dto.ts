import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  IsArray,
  IsDateString,
  IsNumber,
} from 'class-validator';
import { LabCaseStatus } from '@prisma/client';

export class CreateLabCaseDto {
  @IsString()
  @IsNotEmpty()
  patientId!: string;

  @IsString()
  @IsNotEmpty()
  doctorId!: string;

  @IsString()
  @IsNotEmpty()
  labName!: string;

  @IsString()
  @IsNotEmpty()
  caseType!: string;

  @IsArray()
  @IsOptional()
  toothNumbers?: number[];

  @IsString()
  @IsOptional()
  instructions?: string;

  @IsDateString()
  @IsOptional()
  expectedDate?: string;

  @IsNumber()
  @IsOptional()
  cost?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class UpdateLabCaseDto {
  @IsString()
  @IsOptional()
  doctorId?: string;

  @IsEnum(LabCaseStatus)
  @IsOptional()
  status?: LabCaseStatus;

  @IsString()
  @IsOptional()
  labName?: string;

  @IsString()
  @IsOptional()
  caseType?: string;

  @IsArray()
  @IsOptional()
  toothNumbers?: number[];

  @IsString()
  @IsOptional()
  instructions?: string;

  @IsDateString()
  @IsOptional()
  expectedDate?: string;

  @IsDateString()
  @IsOptional()
  deliveryDate?: string;

  @IsNumber()
  @IsOptional()
  cost?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class QueryLabCaseDto {
  @IsString()
  @IsOptional()
  patientId?: string;

  @IsString()
  @IsOptional()
  doctorId?: string;

  @IsEnum(LabCaseStatus)
  @IsOptional()
  status?: LabCaseStatus;

  @IsInt()
  @IsOptional()
  page?: number;

  @IsInt()
  @IsOptional()
  limit?: number;
}