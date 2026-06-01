import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AutomationService, MissedAppointmentService } from './automation.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [AutomationService, MissedAppointmentService],
  exports: [AutomationService],
})
export class AutomationModule {}