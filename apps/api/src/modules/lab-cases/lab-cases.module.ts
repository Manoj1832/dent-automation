import { Module } from '@nestjs/common';
import { LabCasesController } from './lab-cases.controller';
import { LabCasesService } from './lab-cases.service';

@Module({
  controllers: [LabCasesController],
  providers: [LabCasesService],
  exports: [LabCasesService],
})
export class LabCasesModule {}
