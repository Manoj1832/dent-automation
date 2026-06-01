import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  IsDateString,
} from 'class-validator';

export class CreateInvoiceDto {
  @IsString()
  @IsNotEmpty()
  patientId!: string;

  @IsNumber()
  @IsNotEmpty()
  totalAmount!: number;

  @IsArray()
  @IsOptional()
  items?: Array<{ description: string; quantity: number; unitPrice: number; total: number }>;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class UpdateInvoiceDto {
  @IsNumber()
  @IsOptional()
  totalAmount?: number;

  @IsArray()
  @IsOptional()
  items?: Array<{ description: string; quantity: number; unitPrice: number; total: number }>;

  @IsString()
  @IsOptional()
  status?: 'PENDING' | 'PARTIAL' | 'PAID' | 'REFUNDED';

  @IsString()
  @IsOptional()
  notes?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class CreatePaymentDto {
  @IsNumber()
  @IsNotEmpty()
  amount!: number;

  @IsString()
  @IsNotEmpty()
  method!: string;

  @IsString()
  @IsOptional()
  referenceNo?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class QueryInvoiceDto {
  @IsString()
  @IsOptional()
  patientId?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @IsDateString()
  @IsOptional()
  toDate?: string;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}