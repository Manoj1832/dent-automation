import { Controller, Get, Post, Body, Param, Query, BadRequestException } from '@nestjs/common';
import { AppointmentWorkflowService } from '../whatsapp/appointment-workflow.service';

@Controller('public/booking')
export class PublicAppointmentController {
  constructor(private readonly workflowService: AppointmentWorkflowService) {}

  @Get('doctors')
  async getDoctors() {
    return this.workflowService.getAvailableDoctors();
  }

  @Get('slots/:doctorId')
  async getSlots(
    @Param('doctorId') doctorId: string,
    @Query('days') days?: string
  ) {
    const daysAhead = days ? parseInt(days, 10) : 3;
    return this.workflowService.getAvailableSlots(doctorId, daysAhead);
  }

  @Post('patient')
  async identifyOrRegisterPatient(@Body() body: { phone: string; name?: string }) {
    if (!body.phone) {
      throw new BadRequestException('Phone number is required');
    }
    
    const patients = await this.workflowService.searchPatient(body.phone);
    
    if (patients.length === 1) {
      return patients[0];
    } else if (patients.length === 0) {
      if (!body.name) {
        throw new BadRequestException('Name is required for new patients');
      }
      return this.workflowService.createPatient(body.name, body.phone);
    } else {
      // Return first match if multiple exist for the same phone (should not happen with unique constraint, but just in case)
      return patients[0];
    }
  }

  @Post('book')
  async bookSlot(
    @Body() body: { patientId: string; doctorId: string; slotId: string }
  ) {
    if (!body.patientId || !body.doctorId || !body.slotId) {
      throw new BadRequestException('patientId, doctorId, and slotId are required');
    }
    
    try {
      const result = await this.workflowService.bookAppointment(
        body.patientId,
        body.doctorId,
        body.slotId
      );
      return result;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
