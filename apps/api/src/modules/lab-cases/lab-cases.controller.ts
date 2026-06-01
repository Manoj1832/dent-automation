import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LabCasesService } from './lab-cases.service';
import { LabCaseStatus } from '@prisma/client';

@Controller('lab-cases')
@UseGuards(AuthGuard('jwt'))
export class LabCasesController {
  constructor(private readonly labCasesService: LabCasesService) {}

  @Get()
  async findAll() {
    return this.labCasesService.findAll();
  }

  @Post()
  async create(@Body() body: any) {
    return this.labCasesService.create(body);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: LabCaseStatus
  ) {
    return this.labCasesService.updateStatus(id, status);
  }
}
