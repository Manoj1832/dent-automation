import { Injectable, NotFoundException, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFileDto, UpdateFileDto, QueryFileDto } from './dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileStorageService {
  private readonly logger = new Logger(FileStorageService.name);
  private readonly uploadDir = './uploads';
  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024;
  private readonly ALLOWED_MIME_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  constructor(private readonly prisma: PrismaService) {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { mode: 0o755, recursive: true });
    }
  }

  private sanitizePath(filePath: string): string {
    const normalized = path.normalize(filePath);
    const resolved = path.resolve(this.uploadDir, normalized);
    if (!resolved.startsWith(path.resolve(this.uploadDir))) {
      throw new ForbiddenException('Invalid file path');
    }
    return resolved;
  }

  async create(dto: CreateFileDto) {
    if (dto.size > this.MAX_FILE_SIZE) {
      throw new ForbiddenException(`File size exceeds maximum allowed (${this.MAX_FILE_SIZE / 1024 / 1024}MB)`);
    }
    if (!this.ALLOWED_MIME_TYPES.includes(dto.mimeType)) {
      throw new ForbiddenException('File type not allowed');
    }

    if (dto.patientId) {
      const patient = await this.prisma.patient.findUnique({ where: { id: dto.patientId } });
      if (!patient) {
        throw new NotFoundException('Patient not found');
      }
    }

    if (dto.treatmentId) {
      const treatment = await this.prisma.treatment.findUnique({ where: { id: dto.treatmentId } });
      if (!treatment) {
        throw new NotFoundException('Treatment not found');
      }
    }

    const file = await this.prisma.fileRecord.create({
      data: {
        filename: dto.filename,
        originalName: dto.originalName,
        mimeType: dto.mimeType,
        size: dto.size,
        path: dto.path,
        category: dto.category,
        description: dto.description,
        patientId: dto.patientId,
        treatmentId: dto.treatmentId,
        metadata: dto.metadata ? (dto.metadata as any) : {},
      },
      include: {
        patient: { select: { id: true, patientId: true, name: true } },
        treatment: { select: { id: true, procedure: true } },
      },
    });

    this.logger.log(`File record created: ${file.originalName}`);
    return file;
  }

  async findAll(dto: QueryFileDto) {
    const page = dto.page || 1;
    const limit = Math.min(dto.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (dto.patientId) where.patientId = dto.patientId;
    if (dto.treatmentId) where.treatmentId = dto.treatmentId;
    if (dto.category) where.category = dto.category;

    const [files, total] = await Promise.all([
      this.prisma.fileRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { select: { id: true, patientId: true, name: true } },
          treatment: { select: { id: true, procedure: true } },
        },
      }),
      this.prisma.fileRecord.count({ where }),
    ]);

    return {
      files,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const file = await this.prisma.fileRecord.findUnique({
      where: { id },
      include: {
        patient: { select: { id: true, patientId: true, name: true } },
        treatment: { select: { id: true, procedure: true } },
      },
    });

    if (!file) {
      throw new NotFoundException('File record not found');
    }

    return file;
  }

  async update(id: string, dto: UpdateFileDto) {
    await this.findOne(id);

    return this.prisma.fileRecord.update({
      where: { id },
      data: {
        ...dto,
        metadata: dto.metadata ? (dto.metadata as any) : undefined,
      },
    });
  }

  async delete(id: string) {
    const file = await this.findOne(id);

    try {
      const fullPath = this.sanitizePath(file.path);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (error) {
      this.logger.warn(`Failed to delete file from disk: ${file.path}`);
    }

    await this.prisma.fileRecord.delete({ where: { id } });
    this.logger.log(`File deleted: ${file.originalName}`);

    return { deleted: true };
  }

  getFilePath(id: string): string {
    const sanitized = this.sanitizePath(id);
    return sanitized;
  }
}