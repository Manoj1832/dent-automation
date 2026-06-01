import { Module } from '@nestjs/common';
import { PatientController } from './patient.controller';
import { PatientService } from './patient.service';
import { CommonModule } from '../common/common.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [CommonModule, WhatsAppModule],
  controllers: [PatientController],
  providers: [PatientService],
  exports: [PatientService],
})
export class PatientModule {}
