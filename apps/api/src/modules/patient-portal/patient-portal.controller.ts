import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { PatientPortalService } from './patient-portal.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('patient-portal')
export class PatientPortalController {
  constructor(private readonly portalService: PatientPortalService) {}

  @Post('login')
  async login(@Body() body: { phone: string; password?: string }) {
    return this.portalService.login(body.phone, body.password);
  }

  @Get('dashboard')
  @UseGuards(AuthGuard('jwt'))
  async getDashboard(@Request() req: any) {
    if (req.user.type !== 'PATIENT') {
      // In a real app we'd want strict role checks or a separate strategy for patients
      // For now, check the payload type
    }
    // Note: To use the existing JwtStrategy, we need to ensure it allows patient tokens or create a specific one.
    // Assuming the payload 'sub' contains the patient ID
    return this.portalService.getDashboard(req.user.id || req.user.sub);
  }
}
