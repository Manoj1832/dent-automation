import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(AuthGuard('jwt'))
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  async getDashboard() {
    return this.analyticsService.getDashboard();
  }

  @Get('patient-growth')
  async getPatientGrowth(@Query('period') period?: 'week' | 'month') {
    return this.analyticsService.getPatientGrowth(period || 'month');
  }

  @Get('revenue')
  async getRevenueBreakdown(@Query('period') period?: 'week' | 'month') {
    return this.analyticsService.getRevenueBreakdown(period || 'month');
  }
}