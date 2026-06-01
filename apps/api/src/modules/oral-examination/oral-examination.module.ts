import { Module } from '@nestjs/common';
import { OralExaminationController } from './oral-examination.controller';
import { OralExaminationService } from './oral-examination.service';

@Module({
  controllers: [OralExaminationController],
  providers: [OralExaminationService],
  exports: [OralExaminationService],
})
export class OralExaminationModule {}