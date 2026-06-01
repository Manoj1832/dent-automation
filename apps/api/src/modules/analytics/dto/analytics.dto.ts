import {
  IsOptional,
  IsString,
  IsDateString,
  IsInt,
} from 'class-validator';

export class QueryAnalyticsDto {
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  period?: 'day' | 'week' | 'month' | 'year';
}

export class AnalyticsResponse {
  patients: PatientAnalytics;
  appointments: AppointmentAnalytics;
  treatments: TreatmentAnalytics;
  revenue: RevenueAnalytics;
}

export interface PatientAnalytics {
  total: number;
  active: number;
  archived: number;
  newThisWeek: number;
  newThisMonth: number;
  growthRate: number;
}

export interface AppointmentAnalytics {
  total: number;
  scheduled: number;
  completed: number;
  cancelled: number;
  missed: number;
  completionRate: number;
  avgPerDay: number;
}

export interface TreatmentAnalytics {
  total: number;
  totalRevenue: number;
  topProcedures: { procedure: string; count: number }[];
  avgCost: number;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  pendingPayments: number;
  collectedPayments: number;
}