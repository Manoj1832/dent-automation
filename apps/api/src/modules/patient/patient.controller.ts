import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PatientService } from './patient.service';
import { CreatePatientDto, UpdatePatientDto, SearchPatientDto } from './dto';

@Controller('patients')
@UseGuards(AuthGuard('jwt'))
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post()
  async create(@Body() dto: CreatePatientDto) {
    return this.patientService.create(dto);
  }

  @Get('autocomplete')
  async autocomplete(@Query('q') q: string) {
    return this.patientService.autocomplete(q);
  }

  @Get()
  async findAll(@Query() dto: SearchPatientDto) {
    return this.patientService.findAll(dto);
  }

  @Get('stats')
  async getStats() {
    return this.patientService.getStats();
  }

  @Get('qr/:id')
  async getQRCode(@Param('id') id: string) {
    const qrCode = await this.patientService.generateQRCode(id);
    return { qrCode };
  }

  @Get('scan/:patientId')
  async scanQR(@Param('patientId') patientId: string) {
    return this.patientService.scanQRCode(patientId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.patientService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdatePatientDto) {
    return this.patientService.update(id, dto);
  }

  @Patch(':id/archive')
  async archive(@Param('id') id: string) {
    return this.patientService.archive(id);
  }
}
