import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PatientPortalController } from './patient-portal.controller';
import { PatientPortalService } from './patient-portal.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret') || 'dentflow-dev-secret-change-me',
      }),
    }),
  ],
  controllers: [PatientPortalController],
  providers: [PatientPortalService],
})
export class PatientPortalModule {}
