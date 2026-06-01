import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsEnum,
  IsDateString,
  IsObject,
} from 'class-validator';
import { FindingType, Quadrant } from '@prisma/client';

export class CreateOralExaminationDto {
  @IsString()
  @IsNotEmpty()
  patientId!: string;

  @IsDateString()
  @IsOptional()
  examinedAt?: string;

  @IsString()
  @IsOptional()
  examinedById?: string;

  @IsString()
  @IsOptional()
  appointmentId?: string;

  @IsObject()
  @IsOptional()
  stainCalculus?: Record<string, unknown>;

  @IsString()
  @IsOptional()
  orthoNotes?: string;

  @IsString()
  @IsOptional()
  anyOtherMention?: string;

  @IsArray()
  @IsOptional()
  findings?: CreateOralFindingDto[];
}

export class CreateOralFindingDto {
  @IsEnum(FindingType)
  findingType!: FindingType;

  @IsArray()
  @IsOptional()
  toothNumbers?: number[];

  @IsEnum(Quadrant)
  @IsOptional()
  quadrant?: Quadrant;

  @IsString()
  @IsOptional()
  detail?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateOralExaminationDto {
  @IsObject()
  @IsOptional()
  stainCalculus?: Record<string, unknown>;

  @IsString()
  @IsOptional()
  orthoNotes?: string;

  @IsString()
  @IsOptional()
  anyOtherMention?: string;
}