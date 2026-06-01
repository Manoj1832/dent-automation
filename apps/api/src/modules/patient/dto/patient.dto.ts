import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsEnum,
  IsEmail,
  IsDateString,
  Matches,
} from 'class-validator';
import { Gender } from '@prisma/client';

const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;

export class CreatePatientDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Matches(INDIAN_PHONE_REGEX, { message: 'Phone must be a valid 10-digit Indian mobile number (e.g., 9876543210)' })
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsInt()
  @IsOptional()
  age?: number;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  occupation?: string;

  @IsString()
  @IsOptional()
  opNumber?: string;

  @IsDateString()
  @IsOptional()
  firstVisitDate?: string;

  @IsString()
  @IsOptional()
  emergencyName?: string;

  @Matches(INDIAN_PHONE_REGEX, { message: 'Emergency phone must be a valid 10-digit Indian mobile number' })
  @IsOptional()
  emergencyPhone?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class UpdatePatientDto {
  @IsString()
  @IsOptional()
  name?: string;

  @Matches(INDIAN_PHONE_REGEX, { message: 'Phone must be a valid 10-digit Indian mobile number' })
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsInt()
  @IsOptional()
  age?: number;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  occupation?: string;

  @IsString()
  @IsOptional()
  opNumber?: string;

  @IsDateString()
  @IsOptional()
  firstVisitDate?: string;

  @IsString()
  @IsOptional()
  emergencyName?: string;

  @Matches(INDIAN_PHONE_REGEX, { message: 'Emergency phone must be a valid 10-digit Indian mobile number' })
  @IsOptional()
  emergencyPhone?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class SearchPatientDto {
  @IsString()
  @IsOptional()
  query?: string;

  @IsInt()
  @IsOptional()
  page?: number;

  @IsInt()
  @IsOptional()
  limit?: number;
}