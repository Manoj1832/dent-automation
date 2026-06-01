import { Module } from '@nestjs/common';
import { MedicalHistoryController } from './medical-history.controller';
import { MedicalHistoryService } from './medical-history.service';

@Module({
  controllers: [MedicalHistoryController],
  providers: [MedicalHistoryService],
  exports: [MedicalHistoryService],
})
export class MedicalHistoryModule {}