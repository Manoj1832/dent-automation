import { Injectable, UnauthorizedException, NotFoundException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PatientPortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(phone: string, password?: string) {
    // Basic phone normalization
    const cleanedPhone = phone.replace(/[\s\-\+]/g, '').replace(/^0/, '');
    
    let patient = await this.prisma.patient.findFirst({
      where: { phone: cleanedPhone, isArchived: false },
    });

    if (!patient) {
      throw new UnauthorizedException('No account found with this phone number');
    }

    // Since many existing patients might not have a password yet, we will auto-generate one 
    // or let them in without password if they don't have one set, and require them to set it.
    // For this implementation, if password exists, verify it.
    if (patient.password) {
      if (!password) {
        throw new UnauthorizedException('Password required');
      }
      const isValid = await bcrypt.compare(password, patient.password);
      if (!isValid) {
        throw new UnauthorizedException('Invalid credentials');
      }
    } else if (password) {
      // First time setting password
      const hashedPassword = await bcrypt.hash(password, 10);
      patient = await this.prisma.patient.update({
        where: { id: patient.id },
        data: { password: hashedPassword }
      });
    } else {
      throw new UnauthorizedException('Please provide a password to secure your account');
    }

    const payload = { sub: patient.id, type: 'PATIENT' };
    const accessToken = await this.jwtService.signAsync(payload, { expiresIn: '7d' });

    return {
      accessToken,
      patient: {
        id: patient.id,
        name: patient.name,
        phone: patient.phone,
        patientId: patient.patientId,
      }
    };
  }

  async getDashboard(patientId: string) {
    const [appointments, invoices, plans] = await Promise.all([
      this.prisma.appointment.findMany({
        where: { patientId },
        orderBy: { date: 'desc' },
        take: 10,
        include: { doctor: { select: { name: true } } }
      }),
      this.prisma.invoice.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      this.prisma.treatmentPlan.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ]);

    return { appointments, invoices, plans };
  }
}
