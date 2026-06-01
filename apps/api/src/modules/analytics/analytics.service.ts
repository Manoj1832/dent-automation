import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PerformanceService } from '../common/performance.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly performance: PerformanceService,
  ) {}

  async getDashboard() {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      patientStats,
      appointmentStats,
      treatmentStats,
      billingStats,
    ] = await Promise.all([
      this.getPatientAnalytics(weekAgo, monthAgo),
      this.getAppointmentAnalytics(),
      this.getTreatmentAnalytics(),
      this.getBillingAnalytics(),
    ]);

    return {
      patients: patientStats,
      appointments: appointmentStats,
      treatments: treatmentStats,
      revenue: billingStats,
    };
  }

  private async getPatientAnalytics(weekAgo: Date, monthAgo: Date) {
    const [total, active, archived, newThisWeek, newThisMonth] = await Promise.all([
      this.performance.explainQuery('analytics.patient.count', () =>
        this.prisma.patient.count(),
      ),
      this.performance.explainQuery('analytics.patient.activeCount', () =>
        this.prisma.patient.count({ where: { isArchived: false } }),
      ),
      this.performance.explainQuery('analytics.patient.archivedCount', () =>
        this.prisma.patient.count({ where: { isArchived: true } }),
      ),
      this.performance.explainQuery('analytics.patient.newThisWeek', () =>
        this.prisma.patient.count({ where: { createdAt: { gte: weekAgo } } }),
      ),
      this.performance.explainQuery('analytics.patient.newThisMonth', () =>
        this.prisma.patient.count({ where: { createdAt: { gte: monthAgo } } }),
      ),
    ]);

    const twoWeeksAgo = new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prevWeekCount = await this.performance.explainQuery('analytics.patient.prevWeekCount', () =>
      this.prisma.patient.count({
        where: { createdAt: { gte: twoWeeksAgo, lt: weekAgo } },
      }),
    );

    const growthRate = prevWeekCount > 0 ? ((newThisWeek - prevWeekCount) / prevWeekCount) * 100 : 0;

    return { total, active, archived, newThisWeek, newThisMonth, growthRate };
  }

  private async getAppointmentAnalytics() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, scheduled, completed, cancelled, missed, thisMonthTotal] = await Promise.all([
      this.performance.explainQuery('analytics.appointment.count', () =>
        this.prisma.appointment.count(),
      ),
      this.performance.explainQuery('analytics.appointment.scheduledCount', () =>
        this.prisma.appointment.count({ where: { status: 'SCHEDULED' } }),
      ),
      this.performance.explainQuery('analytics.appointment.completedCount', () =>
        this.prisma.appointment.count({ where: { status: 'COMPLETED' } }),
      ),
      this.performance.explainQuery('analytics.appointment.cancelledCount', () =>
        this.prisma.appointment.count({ where: { status: 'CANCELLED' } }),
      ),
      this.performance.explainQuery('analytics.appointment.missedCount', () =>
        this.prisma.appointment.count({ where: { status: 'MISSED' } }),
      ),
      this.performance.explainQuery('analytics.appointment.thisMonthTotal', () =>
        this.prisma.appointment.count({ where: { date: { gte: startOfMonth } } }),
      ),
    ]);

    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currentDay = now.getDate();
    const avgPerDay = currentDay > 0 ? thisMonthTotal / currentDay : 0;

    return { total, scheduled, completed, cancelled, missed, completionRate, avgPerDay };
  }

  private async getTreatmentAnalytics() {
    const [total, revenueAgg] = await Promise.all([
      this.prisma.treatment.count(),
      this.prisma.treatment.aggregate({
        _sum: { cost: true },
        _avg: { cost: true },
      }),
    ]);

    const treatments = await this.prisma.treatment.groupBy({
      by: ['procedure'],
      _count: { procedure: true },
      orderBy: { _count: { procedure: 'desc' } },
      take: 10,
    });

    const topProcedures = treatments.map((t) => ({
      procedure: t.procedure,
      count: t._count.procedure,
    }));

    return {
      total,
      totalRevenue: revenueAgg._sum.cost || 0,
      topProcedures,
      avgCost: revenueAgg._avg.cost || 0,
    };
  }

  private async getBillingAnalytics() {
    const [invoices, payments] = await Promise.all([
      this.prisma.invoice.findMany({
        select: { totalAmount: true, paidAmount: true, status: true },
      }),
      this.prisma.payment.aggregate({ _sum: { amount: true } }),
    ]);

    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const collectedPayments = payments._sum.amount || 0;
    const pendingPayments = totalRevenue - collectedPayments;

    return { totalRevenue, pendingPayments, collectedPayments };
  }

  async getPatientGrowth(period: 'week' | 'month' = 'month') {
    const now = new Date();
    const days = period === 'week' ? 7 : 30;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const patients = await this.prisma.patient.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const grouped: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const key = date.toISOString().split('T')[0];
      grouped[key] = 0;
    }

    for (const p of patients) {
      const key = p.createdAt.toISOString().split('T')[0];
      if (grouped[key] !== undefined) grouped[key]++;
    }

    return Object.entries(grouped).map(([date, count]) => ({ date, count }));
  }

  async getRevenueBreakdown(period: 'week' | 'month' = 'month') {
    const now = new Date();
    const days = period === 'week' ? 7 : 30;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const invoices = await this.prisma.invoice.findMany({
      where: { createdAt: { gte: startDate } },
      select: { totalAmount: true, paidAmount: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    return invoices.map((inv) => ({
      date: inv.createdAt.toISOString().split('T')[0],
      total: inv.totalAmount,
      collected: inv.paidAmount,
    }));
  }
}