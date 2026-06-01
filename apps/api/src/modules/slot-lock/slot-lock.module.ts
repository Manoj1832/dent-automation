import { Module } from '@nestjs/common';
import { SlotLockService } from './slot-lock.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SlotLockService],
  exports: [SlotLockService],
})
export class SlotLockModule {}
