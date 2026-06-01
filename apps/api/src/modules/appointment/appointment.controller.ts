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
import { AppointmentService } from './appointment.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  QueryAppointmentDto,
} from './dto';

@Controller('appointments')
@UseGuards(AuthGuard('jwt'))
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post()
  async create(@Body() dto: CreateAppointmentDto) {
    return this.appointmentService.create(dto);
  }

  @Get()
  async findAll(@Query() dto: QueryAppointmentDto) {
    return this.appointmentService.findAll(dto);
  }

  @Get('stats')
  async getStats() {
    return this.appointmentService.getStats();
  }

  @Get('queue')
  async getTodayQueue(
    @Query('doctorId') doctorId?: string,
    @Query('date') date?: string,
  ) {
    return this.appointmentService.getTodayQueue(doctorId, date);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.appointmentService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
    return this.appointmentService.update(id, dto);
  }
}
