import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { MedicalHistoryService } from './medical-history.service';
import { CreateMedicalHistoryDto, UpdateMedicalHistoryDto } from './dto';

@Controller('medical-history')
export class MedicalHistoryController {
  constructor(private readonly medicalHistoryService: MedicalHistoryService) {}

  @Post()
  create(@Body() dto: CreateMedicalHistoryDto) {
    return this.medicalHistoryService.create(dto);
  }

  @Get('patient/:patientId')
  findByPatientId(@Param('patientId') patientId: string) {
    return this.medicalHistoryService.findByPatientId(patientId);
  }

  @Put('patient/:patientId')
  update(
    @Param('patientId') patientId: string,
    @Body() dto: UpdateMedicalHistoryDto,
  ) {
    return this.medicalHistoryService.update(patientId, dto);
  }

  @Delete('patient/:patientId')
  delete(@Param('patientId') patientId: string) {
    return this.medicalHistoryService.delete(patientId);
  }
}