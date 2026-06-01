import { Injectable, NotFoundException, ConflictException, Logger, Inject, Optional } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PerformanceService } from '../common/performance.service';
import { CacheService } from '../common/cache.service';
import { WhatsAppSenderService } from '../whatsapp/whatsapp-sender.service';
import { CreatePatientDto, UpdatePatientDto, SearchPatientDto } from './dto';
import * as QRCode from 'qrcode';

@Injectable()
export class PatientService {
  private readonly logger = new Logger(PatientService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly performance: PerformanceService,
    private readonly cache: CacheService,
    @Inject(WhatsAppSenderService) @Optional() private readonly whatsappSender: WhatsAppSenderService | null,
  ) {}

  async create(dto: CreatePatientDto) {
    if (dto.phone) {
      const existingPhone = await this.prisma.patient.findFirst({
        where: { phone: dto.phone, isArchived: false },
      });
      if (existingPhone) {
        throw new ConflictException('A patient with this phone number already exists');
      }
    }

    if (dto.email) {
      const existingEmail = await this.prisma.patient.findFirst({
        where: { email: dto.email, isArchived: false },
      });
      if (existingEmail) {
        throw new ConflictException('A patient with this email already exists');
      }
    }

    const patientId = await this.generatePatientId();
    const now = new Date();

    const patient = await this.prisma.patient.create({
      data: {
        patientId,
        opNumber: dto.opNumber,
        firstVisitDate: dto.firstVisitDate ? new Date(dto.firstVisitDate) : now,
        name: dto.name.trim(),
        phone: dto.phone,
        email: dto.email?.toLowerCase().trim(),
        age: dto.age,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        gender: dto.gender,
        address: dto.address?.trim(),
        occupation: dto.occupation?.trim(),
        emergencyName: dto.emergencyName?.trim(),
        emergencyPhone: dto.emergencyPhone,
        metadata: dto.metadata as any || {},
      },
    });

    this.logger.log(`Patient created: ${patient.patientId} — ${patient.name}`);
    await this.cache.invalidate('patients:list:');
    await this.cache.invalidate('patients:stats');

    if (patient.phone) {
      this.sendPatientIdCard(patient.id, patient.phone).catch((err) => {
        this.logger.error(`Failed to send ID card to ${patient.phone}: ${err.message}`);
      });
    }

    return patient;
  }

  private async sendPatientIdCard(patientId: string, phone: string): Promise<void> {
    if (!this.whatsappSender) {
      this.logger.warn('WhatsApp sender not available, skipping ID card');
      return;
    }

    try {
      const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
      if (!patient || !patient.phone) return;

      const qrPayload = JSON.stringify({
        id: patient.id,
        patientId: patient.patientId,
        name: patient.name,
        phone: patient.phone,
      });
      const qrDataUrl = await QRCode.toDataURL(qrPayload, {
        width: 300,
        margin: 2,
        color: { dark: '#1a1a2e', light: '#ffffff' },
      });

      const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '');

      const message = `🏥 *Welcome to SREE ARUMUGAVADIVU DENTAL CLINIC!*\n\n` +
        `📋 *Patient ID Card*\n\n` +
        `👤 Name: ${patient.name}\n` +
        `🆔 Patient ID: ${patient.patientId}\n` +
        `📱 Phone: ${patient.phone}\n` +
        `📅 First Visit: ${patient.firstVisitDate?.toLocaleDateString('en-IN') || 'Today'}\n\n` +
        `📱 Save this QR code - it contains your patient ID for quick check-in!\n\n` +
        `Thank you for choosing DentFlow! 🌟`;

      await this.whatsappSender.sendText(phone, message);
      await this.whatsappSender.sendImage(phone, base64Data, `Patient ID: ${patient.patientId}`);

      this.logger.log(`Sent ID card to patient ${patient.patientId} at ${phone}`);
    } catch (error) {
      this.logger.error(`Failed to send ID card: ${(error as Error).message}`);
    }
  }

  async autocomplete(q: string) {
    if (!q || q.trim().length < 1) return { results: [] };

    const term = q.trim();
    const cacheKey = `patients:ac:${term.toLowerCase()}`;

    return this.cache.remember(cacheKey, 10, async () => {
      const results = await this.prisma.$queryRaw<
        { id: string; patientId: string; name: string; phone: string | null; similarity: number }[]
      >`
        SELECT id, "patientId", name, phone,
               GREATEST(
                 similarity(name, ${term}),
                 similarity("patientId", ${term}),
                 similarity(COALESCE(phone, ''), ${term})
               ) AS similarity
        FROM patients
        WHERE "isArchived" = false
          AND (
            name % ${term}
            OR "patientId" ILIKE ${`${term}%`}
            OR phone ILIKE ${`%${term}%`}
          )
        ORDER BY similarity DESC
        LIMIT 8
      `;

      return { results };
    });
  }

  async findAll(dto: SearchPatientDto) {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;
    const query = dto.query || '';

    const cacheKey = `patients:list:${query}:page${page}:limit${limit}`;

    return this.cache.remember(cacheKey, 30, async () => {
      const where: Record<string, unknown> = { isArchived: false };

      if (query) {
        const cleaned = query.replace(/[\s\-]/g, '');
        where.OR = [
          { name: { contains: query, mode: 'insensitive' } },
          { phone: { contains: cleaned } },
          { patientId: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ];
      }

      const [patients, total] = await Promise.all([
        this.performance.explainQuery('patient.findAll', () =>
          this.prisma.patient.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              patientId: true,
              name: true,
              phone: true,
              age: true,
              gender: true,
              createdAt: true,
              _count: { select: { appointments: true, treatments: true } },
            },
          }),
        ),
        this.performance.explainQuery('patient.count', () =>
          this.prisma.patient.count({ where }),
        ),
      ]);

      return {
        patients,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    });
  }

  async findOne(id: string) {
    const cacheKey = `patients:one:${id}`;

    return this.cache.remember(cacheKey, 60, () =>
      this.prisma.patient.findUniqueOrThrow({
        where: { id },
        include: {
          medicalHistory: true,
          chiefComplaints: { orderBy: { createdAt: 'desc' }, take: 5 },
          oralExaminations: { orderBy: { examinedAt: 'desc' }, take: 3 },
          treatmentPlans: {
            orderBy: { plannedAt: 'desc' },
            take: 5,
            include: {
              plannedBy: { select: { name: true } },
              procedures: true,
            },
          },
          appointments: {
            orderBy: { date: 'desc' },
            take: 10,
            include: { doctor: { select: { name: true } } },
          },
          treatments: {
            orderBy: { visitDate: 'desc' },
            take: 10,
            include: { doctor: { select: { name: true } } },
          },
          _count: {
            select: { appointments: true, treatments: true, files: true, invoices: true },
          },
        },
      }).catch(() => { throw new NotFoundException('Patient not found'); })
    );
  }

  async scanQRCode(patientId: string) {
    return this.findByPatientId(patientId);
  }

  async findByPatientId(patientId: string) {
    let searchTerm = patientId;
    try {
      const decoded = JSON.parse(patientId);
      if (decoded.patientId) searchTerm = decoded.patientId;
      else if (decoded.id) searchTerm = decoded.id;
    } catch { }

    const patient = await this.prisma.patient.findFirst({
      where: {
        OR: [
          { patientId: { equals: searchTerm, mode: 'insensitive' } },
          { id: searchTerm },
        ],
      },
    });

    if (!patient) throw new NotFoundException('Patient not found');

    const [appointments, treatments, invoices, treatmentPlans, medicalHistory] = await Promise.all([
      this.prisma.appointment.findMany({
        where: { patientId: patient.id },
        orderBy: { date: 'desc' },
        take: 20,
        include: { doctor: { select: { name: true } } },
      }),
      this.prisma.treatment.findMany({
        where: { patientId: patient.id },
        orderBy: { visitDate: 'desc' },
        take: 20,
        include: { doctor: { select: { name: true } } },
      }),
      this.prisma.invoice.findMany({
        where: { patientId: patient.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { payments: true },
      }),
      this.prisma.treatmentPlan.findMany({
        where: { patientId: patient.id },
        orderBy: { plannedAt: 'desc' },
        take: 10,
        include: {
          plannedBy: { select: { name: true } },
          procedures: true,
        },
      }),
      this.prisma.medicalHistory.findFirst({
        where: { patientId: patient.id },
      }),
    ]);

    const upcomingAppointments = appointments.filter(a => new Date(a.date) >= new Date() && a.status === 'SCHEDULED');
    const pastVisits = appointments.filter(a => new Date(a.date) < new Date() || a.status === 'COMPLETED');

    const visitHistory = pastVisits.map(apt => ({
      date: apt.date,
      reason: apt.type || 'Check-up',
      doctor: apt.doctor?.name,
      status: apt.status,
      notes: apt.notes,
    }));

    const treatmentHistory = treatments.map(t => ({
      id: t.id,
      date: t.visitDate,
      procedure: t.procedure,
      teeth: t.toothNumbers,
      notes: t.procedureNotes,
      cost: t.cost,
      doctor: t.doctor?.name,
      prescription: t.prescription,
      medicationsGiven: t.medicationsGiven,
      followUpDate: t.followUpDate,
      followUpNotes: t.followUpNotes,
    }));

    const billingHistory = invoices.map(inv => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      date: inv.createdAt,
      total: inv.totalAmount,
      paid: inv.paidAmount,
      status: inv.status,
      payments: inv.payments.map(p => ({
        amount: p.amount,
        method: p.method,
        date: p.createdAt,
      })),
    }));

    const pendingTreatments = treatmentPlans
      .filter(tp => tp.status !== 'COMPLETED')
      .map(tp => ({
        id: tp.id,
        notes: tp.notes,
        plannedAt: tp.plannedAt,
        procedures: tp.procedures.map(p => ({ name: p.notes || 'Procedure', cost: p.estimatedCost })),
        status: tp.status,
        estimatedTotal: tp.estimatedTotal,
      }));

    const reminders = this.generatePrescriptionReminders(treatments);

    return {
      patient: {
        id: patient.id,
        patientId: patient.patientId,
        name: patient.name,
        phone: patient.phone,
        email: patient.email,
        age: patient.age,
        gender: patient.gender,
        address: patient.address,
        occupation: patient.occupation,
        firstVisitDate: patient.firstVisitDate,
      },
      visitHistory,
      treatmentHistory,
      billingHistory,
      upcomingAppointments: upcomingAppointments.map(apt => ({
        id: apt.id,
        date: apt.date,
        time: apt.startTime,
        doctor: apt.doctor?.name,
        type: apt.type,
        queueNumber: apt.queueNumber,
      })),
      pendingTreatments,
      reminders,
      medicalHistory: medicalHistory ? {
        diabetic: medicalHistory.diabetic,
        hypertension: medicalHistory.hypertension,
        hepatic: medicalHistory.hepatic,
        cardioVascular: medicalHistory.cardioVascular,
        thyroid: medicalHistory.thyroid,
        ulcer: medicalHistory.ulcer,
        drugAllergy: medicalHistory.drugAllergy,
        drugAllergyDetail: medicalHistory.drugAllergyDetail,
        bleedingDisorder: medicalHistory.bleedingDisorder,
        pregnancy: medicalHistory.pregnancy,
        lactatingMother: medicalHistory.lactatingMother,
        otherSpecify: medicalHistory.otherSpecify,
      } : null,
      stats: {
        totalVisits: pastVisits.length,
        totalTreatments: treatments.length,
        totalSpent: invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0),
      },
    };
  }

  private generatePrescriptionReminders(treatments: any[]) {
    const reminders: Array<{ date: Date; message: string; treatmentId: string }> = [];
    const now = new Date();

    for (const t of treatments) {
      if (t.followUpDate) {
        const followUpDate = new Date(t.followUpDate);
        if (followUpDate > now) {
          reminders.push({
            date: followUpDate,
            message: `Follow-up: ${t.procedure || 'Treatment'}${t.followUpNotes ? ' - ' + t.followUpNotes : ''}`,
            treatmentId: t.id,
          });
        }
      }

      if (t.prescription || t.medicationsGiven) {
        const reminderDate = new Date(t.visitDate);
        reminderDate.setDate(reminderDate.getDate() + 7);
        if (reminderDate > now && reminderDate <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)) {
          reminders.push({
            date: reminderDate,
            message: `Medication review: ${t.procedure || 'Treatment'}`,
            treatmentId: t.id,
          });
        }
      }
    }

    return reminders
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 10);
  }

  async update(id: string, dto: UpdatePatientDto) {
    await this.findOne(id);

    if (dto.phone) {
      const existingPhone = await this.prisma.patient.findFirst({
        where: { phone: dto.phone, isArchived: false, NOT: { id } },
      });
      if (existingPhone) {
        throw new ConflictException('A patient with this phone number already exists');
      }
    }

    if (dto.email) {
      const existingEmail = await this.prisma.patient.findFirst({
        where: { email: dto.email, isArchived: false, NOT: { id } },
      });
      if (existingEmail) {
        throw new ConflictException('A patient with this email already exists');
      }
    }

    const patient = await this.prisma.patient.update({
      where: { id },
      data: {
        ...dto,
        name: dto.name?.trim(),
        email: dto.email?.toLowerCase().trim(),
        address: dto.address?.trim(),
        occupation: dto.occupation?.trim(),
        emergencyName: dto.emergencyName?.trim(),
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        metadata: dto.metadata as any || {},
      },
    });

    this.logger.log(`Patient updated: ${patient.patientId}`);
    await this.cache.invalidate(`patients:one:${id}`);
    await this.cache.invalidate('patients:list:');
    return patient;
  }

  async archive(id: string) {
    await this.findOne(id);

    const patient = await this.prisma.patient.update({
      where: { id },
      data: { isArchived: true },
    });

    this.logger.log(`Patient archived: ${patient.patientId}`);
    await this.cache.invalidate(`patients:one:${id}`);
    await this.cache.invalidate('patients:list:');
    return patient;
  }

  async generateQRCode(id: string): Promise<string> {
    const patient = await this.findOne(id);
    const qrPayload = {
      id: patient.id,
      patientId: patient.patientId,
      name: patient.name || '',
      phone: patient.phone || '',
    };
    const qrDataUrl = await QRCode.toDataURL(JSON.stringify(qrPayload), {
      width: 300,
      margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' },
    });
    return qrDataUrl;
  }

  async getStats() {
    const cacheKey = 'patients:stats';
    return this.cache.remember(cacheKey, 120, async () => {
      const [total, active, archived, today] = await Promise.all([
        this.prisma.patient.count(),
        this.prisma.patient.count({ where: { isArchived: false } }),
        this.prisma.patient.count({ where: { isArchived: true } }),
        this.prisma.patient.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
      ]);
      return { total, active, archived, registeredToday: today };
    });
  }

  private async generatePatientId(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `DF-${year}-`;

    const lastPatient = await this.prisma.patient.findFirst({
      where: { patientId: { startsWith: prefix } },
      orderBy: { patientId: 'desc' },
      select: { patientId: true },
    });

    let nextNumber = 1;
    if (lastPatient) {
      const lastNumber = parseInt(lastPatient.patientId.split('-')[2], 10);
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${String(nextNumber).padStart(4, '0')}`;
  }
}