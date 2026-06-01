import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TreatmentService } from './treatment.service';
import { CreateTreatmentDto, UpdateTreatmentDto, QueryTreatmentDto } from './dto';

@Controller('treatments')
@UseGuards(AuthGuard('jwt'))
export class TreatmentController {
  constructor(private readonly treatmentService: TreatmentService) {}

  @Post()
  async create(@Body() dto: CreateTreatmentDto) {
    return this.treatmentService.create(dto);
  }

  @Get()
  async findAll(@Query() dto: QueryTreatmentDto) {
    return this.treatmentService.findAll(dto);
  }

  @Get('stats')
  async getStats() {
    return this.treatmentService.getStats();
  }

  @Get('patient/:patientId')
  async getPatientHistory(@Param('patientId') patientId: string) {
    return this.treatmentService.getPatientHistory(patientId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.treatmentService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateTreatmentDto) {
    return this.treatmentService.update(id, dto);
  }
}