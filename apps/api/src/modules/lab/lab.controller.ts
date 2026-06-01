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
import { LabService } from './lab.service';
import { CreateLabCaseDto, UpdateLabCaseDto, QueryLabCaseDto } from './dto';

@Controller('lab-cases')
@UseGuards(AuthGuard('jwt'))
export class LabController {
  constructor(private readonly labService: LabService) {}

  @Post()
  async create(@Body() dto: CreateLabCaseDto) {
    return this.labService.create(dto);
  }

  @Get()
  async findAll(@Query() dto: QueryLabCaseDto) {
    return this.labService.findAll(dto);
  }

  @Get('stats')
  async getStats() {
    return this.labService.getStats();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.labService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateLabCaseDto) {
    return this.labService.update(id, dto);
  }
}