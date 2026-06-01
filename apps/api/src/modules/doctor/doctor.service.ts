import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class DoctorService {
  private readonly logger = new Logger(DoctorService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: { query?: string; page?: number; limit?: number }) {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 20, 100);
    const skip = (page - 1) * limit;
    const where: Prisma.UserWhereInput = {
      role: 'DOCTOR',
      isActive: true,
    };

    if (params.query) {
      where.OR = [
        { name: { contains: params.query, mode: 'insensitive' } },
        { email: { contains: params.query, mode: 'insensitive' } },
      ];
    }

    try {
      const [doctors, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { name: 'asc' },
          select: {
            id: true, name: true, email: true, phone: true, role: true, isActive: true,
            createdAt: true,
            _count: { select: { appointments: true, treatments: true } },
          },
        }),
        this.prisma.user.count({ where }),
      ]);

      return {
        doctors,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      };
    } catch (error) {
      this.logger.error('Failed to fetch doctors', error);
      return {
        doctors: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 1 },
      };
    }
  }

  async findOne(id: string) {
    try {
      const doctor = await this.prisma.user.findUnique({
        where: { id },
        include: {
          _count: { select: { appointments: true, treatments: true } },
        },
      });
      if (!doctor) throw new NotFoundException('Doctor not found');
      if (doctor.role !== 'DOCTOR') throw new NotFoundException('User is not a doctor');
      return doctor;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to fetch doctor ${id}`, error);
      throw new NotFoundException('Doctor not found');
    }
  }

  async create(dto: { name: string; email: string; password: string; phone?: string; status?: string }) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    if (dto.phone) {
      const existingPhone = await this.prisma.user.findFirst({
        where: { phone: dto.phone, isActive: true },
      });
      if (existingPhone) {
        throw new ConflictException('Phone number already in use');
      }
    }

    if (!dto.password || dto.password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    if (!dto.name || dto.name.trim().length < 2) {
      throw new BadRequestException('Name must be at least 2 characters');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    try {
      const doctor = await this.prisma.user.create({
        data: {
          name: dto.name.trim(),
          email: dto.email.toLowerCase().trim(),
          password: hashedPassword,
          phone: dto.phone,
          role: 'DOCTOR',
          isActive: dto.status === 'INACTIVE' ? false : true,
        },
        select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true },
      });

      this.logger.log(`Doctor created: ${doctor.email}`);
      return doctor;
    } catch (error) {
      this.logger.error('Failed to create doctor', error);
      throw error;
    }
  }

  async update(id: string, dto: { name?: string; phone?: string; status?: string }) {
    const existing = await this.findOne(id);

    if (dto.phone && dto.phone !== existing.phone) {
      const existingPhone = await this.prisma.user.findFirst({
        where: { phone: dto.phone, isActive: true, NOT: { id } },
      });
      if (existingPhone) {
        throw new ConflictException('Phone number already in use');
      }
    }

    const updateData: Prisma.UserUpdateInput = {};
    if (dto.name) updateData.name = dto.name.trim();
    if (dto.phone) updateData.phone = dto.phone;
    if (dto.status) updateData.isActive = dto.status === 'ACTIVE';

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true },
    });
  }

  async archive(id: string) {
    const doctor = await this.findOne(id);
    
    const activeAppointments = await this.prisma.appointment.count({
      where: { doctorId: id, status: { in: ['SCHEDULED', 'IN_PROGRESS'] } },
    });
    
    if (activeAppointments > 0) {
      throw new BadRequestException(`Cannot archive doctor with ${activeAppointments} active appointments`);
    }

    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }
}