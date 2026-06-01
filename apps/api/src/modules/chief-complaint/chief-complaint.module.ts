import { Module } from '@nestjs/common';
import { ChiefComplaintController } from './chief-complaint.controller';
import { ChiefComplaintService } from './chief-complaint.service';

@Module({
  controllers: [ChiefComplaintController],
  providers: [ChiefComplaintService],
  exports: [ChiefComplaintService],
})
export class ChiefComplaintModule {}