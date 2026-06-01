import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { FileStorageService } from './file-storage.service';
import { CreateFileDto, UpdateFileDto, QueryFileDto } from './dto';

@Controller('files')
@UseGuards(AuthGuard('jwt'))
export class FileStorageController {
  constructor(private readonly fileStorageService: FileStorageService) {}

  @Post()
  async create(@Body() dto: CreateFileDto) {
    return this.fileStorageService.create(dto);
  }

  @Get()
  async findAll(@Query() dto: QueryFileDto) {
    return this.fileStorageService.findAll(dto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.fileStorageService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateFileDto) {
    return this.fileStorageService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.fileStorageService.delete(id);
  }
}