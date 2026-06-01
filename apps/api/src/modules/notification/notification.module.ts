import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationProcessor } from './notification.processor';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [WhatsAppModule],
  providers: [NotificationService, NotificationProcessor],
  exports: [NotificationService],
})
export class NotificationModule {}