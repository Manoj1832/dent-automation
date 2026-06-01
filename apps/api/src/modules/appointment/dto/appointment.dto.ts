import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEnum,
  IsInt,
} from 'class-validator';
import { AppointmentStatus } from '@prisma/client';

export class CreateAppointmentDto {
  @IsString()
  @IsNotEmpty()
  patientId!: string;

  @IsString()
  @IsNotEmpty()
  doctorId!: string;

  @IsDateString()
  @IsNotEmpty()
  date!: string;

  @IsDateString()
  @IsNotEmpty()
  startTime!: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateAppointmentDto {
  @IsEnum(AppointmentStatus)
  @IsOptional()
  status?: AppointmentStatus;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsDateString()
  @IsOptional()
  startTime?: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;

  @IsString()
  @IsOptional()
  doctorId?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsInt()
  @IsOptional()
  queueNumber?: number;
}

export class QueryAppointmentDto {
  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  doctorId?: string;

  @IsEnum(AppointmentStatus)
  @IsOptional()
  status?: AppointmentStatus;

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
