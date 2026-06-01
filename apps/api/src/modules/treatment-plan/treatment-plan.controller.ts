import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { TreatmentPlanService } from './treatment-plan.service';
import {
  CreateTreatmentPlanDto,
  UpdateTreatmentPlanDto,
  CreatePlannedProcedureDto,
  UpdatePlannedProcedureDto,
} from './dto';

@Controller('treatment-plans')
export class TreatmentPlanController {
  constructor(private readonly treatmentPlanService: TreatmentPlanService) {}

  @Post()
  create(@Body() dto: CreateTreatmentPlanDto) {
    return this.treatmentPlanService.create(dto);
  }

  @Get('patient/:patientId')
  findByPatientId(@Param('patientId') patientId: string) {
    return this.treatmentPlanService.findByPatientId(patientId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.treatmentPlanService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTreatmentPlanDto,
  ) {
    return this.treatmentPlanService.update(id, dto);
  }

  @Post(':id/procedures')
  addProcedure(
    @Param('id') id: string,
    @Body() dto: CreatePlannedProcedureDto,
  ) {
    return this.treatmentPlanService.addProcedure(id, dto);
  }

  @Put('procedures/:procedureId')
  updateProcedure(
    @Param('procedureId') procedureId: string,
    @Body() dto: UpdatePlannedProcedureDto,
  ) {
    return this.treatmentPlanService.updateProcedure(procedureId, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.treatmentPlanService.delete(id);
  }
}