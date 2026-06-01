import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PerformanceService {
  private readonly logger = new Logger(PerformanceService.name);
  private readonly EXPLAIN_THRESHOLD_MS = 100;

  constructor(private readonly prisma: PrismaService) {}

  async explainQuery<T>(
    label: string,
    queryFn: () => Promise<T>,
  ): Promise<T> {
    const start = Date.now();
    const result = await queryFn();
    const duration = Date.now() - start;

    if (duration > this.EXPLAIN_THRESHOLD_MS) {
      this.logger.warn(`[PERF] Slow query (>${this.EXPLAIN_THRESHOLD_MS}ms): ${label} — ${duration}ms`);
    }

    return result;
  }
}