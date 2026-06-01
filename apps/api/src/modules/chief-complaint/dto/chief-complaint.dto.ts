import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEnum,
} from 'class-validator';
import { Jaw, Side } from '@prisma/client';

export class CreateChiefComplaintDto {
  @IsString()
  @IsNotEmpty()
  patientId!: string;

  @IsBoolean()
  @IsOptional()
  pain?: boolean;

  @IsBoolean()
  @IsOptional()
  mobility?: boolean;

  @IsBoolean()
  @IsOptional()
  irregularlyArranged?: boolean;

  @IsBoolean()
  @IsOptional()
  bleedingGums?: boolean;

  @IsBoolean()
  @IsOptional()
  decay?: boolean;

  @IsBoolean()
  @IsOptional()
  missingTeeth?: boolean;

  @IsBoolean()
  @IsOptional()
  wantsClean?: boolean;

  @IsEnum(Jaw)
  @IsOptional()
  jaw?: Jaw;

  @IsEnum(Side)
  @IsOptional()
  side?: Side;

  @IsString()
  @IsOptional()
  region?: string;

  @IsArray()
  @IsOptional()
  toothNumbers?: number[];

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateChiefComplaintDto {
  @IsBoolean()
  @IsOptional()
  pain?: boolean;

  @IsBoolean()
  @IsOptional()
  mobility?: boolean;

  @IsBoolean()
  @IsOptional()
  irregularlyArranged?: boolean;

  @IsBoolean()
  @IsOptional()
  bleedingGums?: boolean;

  @IsBoolean()
  @IsOptional()
  decay?: boolean;

  @IsBoolean()
  @IsOptional()
  missingTeeth?: boolean;

  @IsBoolean()
  @IsOptional()
  wantsClean?: boolean;

  @IsEnum(Jaw)
  @IsOptional()
  jaw?: Jaw;

  @IsEnum(Side)
  @IsOptional()
  side?: Side;

  @IsString()
  @IsOptional()
  region?: string;

  @IsArray()
  @IsOptional()
  toothNumbers?: number[];

  @IsString()
  @IsOptional()
  notes?: string;
}