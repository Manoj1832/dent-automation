import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { PatientModule } from './modules/patient/patient.module';
import { AppointmentModule } from './modules/appointment/appointment.module';
import { TreatmentModule } from './modules/treatment/treatment.module';
import { LabModule } from './modules/lab/lab.module';
import { LabCasesModule } from './modules/lab-cases/lab-cases.module';
import { PatientPortalModule } from './modules/patient-portal/patient-portal.module';
import { FileStorageModule } from './modules/file-storage/file-storage.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { BillingModule } from './modules/billing/billing.module';
import { AutomationModule } from './modules/automation/automation.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { DoctorModule } from './modules/doctor/doctor.module';
import { NotificationModule } from './modules/notification/notification.module';
import { SlotLockModule } from './modules/slot-lock/slot-lock.module';
import { MedicalHistoryModule } from './modules/medical-history/medical-history.module';
import { ChiefComplaintModule } from './modules/chief-complaint/chief-complaint.module';
import { OralExaminationModule } from './modules/oral-examination/oral-examination.module';
import { TreatmentPlanModule } from './modules/treatment-plan/treatment-plan.module';
import { RateLimiterModule } from './modules/rate-limiter/rate-limiter.module';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';
import { AiModule } from './modules/ai/ai.module';
import { RedisModule } from './modules/common/redis.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    AuthModule,
    PatientModule,
    AppointmentModule,
    TreatmentModule,
    LabModule,
    LabCasesModule,
    PatientPortalModule,
    FileStorageModule,
    AnalyticsModule,
    BillingModule,
    AutomationModule,
    RealtimeModule,
    DoctorModule,
    NotificationModule,
    SlotLockModule,
    MedicalHistoryModule,
    ChiefComplaintModule,
    OralExaminationModule,
    TreatmentPlanModule,
    RateLimiterModule,
    WhatsAppModule,
    AiModule,
  ],
})
export class AppModule {}

