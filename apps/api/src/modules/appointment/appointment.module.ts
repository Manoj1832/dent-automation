import { Module, forwardRef } from '@nestjs/common';
import { AppointmentController } from './appointment.controller';
import { PublicAppointmentController } from './public-appointment.controller';
import { AppointmentService } from './appointment.service';
import { PriorityQueueService } from './priority-queue.service';
import { AppointmentReminderService } from './appointment-reminder.service';
import { CommonModule } from '../common/common.module';
import { SlotLockModule } from '../slot-lock/slot-lock.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [CommonModule, SlotLockModule, forwardRef(() => WhatsAppModule)],
  controllers: [AppointmentController, PublicAppointmentController],
  providers: [AppointmentService, PriorityQueueService, AppointmentReminderService],
  exports: [AppointmentService, PriorityQueueService],
})
export class AppointmentModule {}
