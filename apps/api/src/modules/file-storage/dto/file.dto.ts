import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
} from 'class-validator';
import { FileCategory } from '@prisma/client';

export class CreateFileDto {
  @IsString()
  @IsNotEmpty()
  filename!: string;

  @IsString()
  @IsNotEmpty()
  originalName!: string;

  @IsString()
  @IsNotEmpty()
  mimeType!: string;

  @IsInt()
  @IsNotEmpty()
  size!: number;

  @IsString()
  @IsNotEmpty()
  path!: string;

  @IsEnum(FileCategory)
  @IsOptional()
  category?: FileCategory;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  patientId?: string;

  @IsString()
  @IsOptional()
  treatmentId?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class UpdateFileDto {
  @IsEnum(FileCategory)
  @IsOptional()
  category?: FileCategory;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class QueryFileDto {
  @IsString()
  @IsOptional()
  patientId?: string;

  @IsString()
  @IsOptional()
  treatmentId?: string;

  @IsEnum(FileCategory)
  @IsOptional()
  category?: FileCategory;

  @IsInt()
  @IsOptional()
  page?: number;

  @IsInt()
  @IsOptional()
  limit?: number;
}