import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { OralExaminationService } from './oral-examination.service';
import {
  CreateOralExaminationDto,
  UpdateOralExaminationDto,
  CreateOralFindingDto,
} from './dto';

@Controller('oral-examinations')
export class OralExaminationController {
  constructor(private readonly oralExaminationService: OralExaminationService) {}

  @Post()
  create(@Body() dto: CreateOralExaminationDto) {
    return this.oralExaminationService.create(dto);
  }

  @Get('patient/:patientId')
  findByPatientId(@Param('patientId') patientId: string) {
    return this.oralExaminationService.findByPatientId(patientId);
  }

  @Get('patient/:patientId/latest')
  findLatestByPatientId(@Param('patientId') patientId: string) {
    return this.oralExaminationService.findLatestByPatientId(patientId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.oralExaminationService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOralExaminationDto,
  ) {
    return this.oralExaminationService.update(id, dto);
  }

  @Post(':id/findings')
  addFinding(
    @Param('id') id: string,
    @Body() dto: CreateOralFindingDto,
  ) {
    return this.oralExaminationService.addFinding(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.oralExaminationService.delete(id);
  }
}