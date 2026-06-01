import { Module, forwardRef } from '@nestjs/common';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppAdminController } from './whatsapp-admin.controller';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppSenderService } from './whatsapp-sender.service';
import { ConversationEngineService } from './conversation-engine.service';
import { AppointmentWorkflowService } from './appointment-workflow.service';
import { CommonModule } from '../common/common.module';
import { SlotLockModule } from '../slot-lock/slot-lock.module';
import { AppointmentModule } from '../appointment/appointment.module';

@Module({
  imports: [CommonModule, SlotLockModule, forwardRef(() => AppointmentModule)],
  controllers: [WhatsAppController, WhatsAppAdminController],
  providers: [
    WhatsAppService,
    WhatsAppSenderService,
    ConversationEngineService,
    AppointmentWorkflowService,
  ],
  exports: [WhatsAppService, WhatsAppSenderService, AppointmentWorkflowService],
})
export class WhatsAppModule {}
