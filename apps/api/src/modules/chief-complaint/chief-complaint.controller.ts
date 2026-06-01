import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ChiefComplaintService } from './chief-complaint.service';
import { CreateChiefComplaintDto, UpdateChiefComplaintDto } from './dto';

@Controller('chief-complaints')
export class ChiefComplaintController {
  constructor(private readonly chiefComplaintService: ChiefComplaintService) {}

  @Post()
  create(@Body() dto: CreateChiefComplaintDto) {
    return this.chiefComplaintService.create(dto);
  }

  @Get('patient/:patientId')
  findByPatientId(@Param('patientId') patientId: string) {
    return this.chiefComplaintService.findByPatientId(patientId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.chiefComplaintService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateChiefComplaintDto) {
    return this.chiefComplaintService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.chiefComplaintService.delete(id);
  }
}