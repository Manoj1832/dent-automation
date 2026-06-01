import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PerformanceService } from './performance.service';
import { CacheService } from './cache.service';

@Module({
  imports: [PrismaModule],
  providers: [PerformanceService, CacheService],
  exports: [PerformanceService, CacheService],
})
export class CommonModule {}