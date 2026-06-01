import { Controller, Get, Post, Put, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DoctorService } from './doctor.service';

@Controller('doctors')
@UseGuards(AuthGuard('jwt'))
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Post()
  async create(@Body() dto: { name: string; email: string; password: string; phone?: string }) {
    return this.doctorService.create(dto);
  }

  @Get()
  async findAll(@Query() dto: { search?: string; page?: number; limit?: number }) {
    return this.doctorService.findAll(dto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.doctorService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: { name?: string; phone?: string }) {
    return this.doctorService.update(id, dto);
  }

  @Patch(':id/archive')
  async archive(@Param('id') id: string) {
    return this.doctorService.archive(id);
  }
}