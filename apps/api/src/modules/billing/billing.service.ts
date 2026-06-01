import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInvoiceDto, UpdateInvoiceDto, CreatePaymentDto, QueryInvoiceDto } from './dto';
import { Prisma, PaymentStatus } from '@prisma/client';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;

    const lastInvoice = await this.prisma.invoice.findFirst({
      where: { invoiceNumber: { startsWith: prefix } },
      orderBy: { invoiceNumber: 'desc' },
      select: { invoiceNumber: true },
    });

    let nextNumber = 1;
    if (lastInvoice) {
      const lastNum = parseInt(lastInvoice.invoiceNumber.split('-')[2], 10);
      nextNumber = lastNum + 1;
    }

    return `${prefix}${String(nextNumber).padStart(4, '0')}`;
  }

  async createInvoice(dto: CreateInvoiceDto) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId },
    });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    if (!dto.totalAmount || dto.totalAmount <= 0) {
      throw new BadRequestException('Invalid total amount');
    }

    const invoiceNumber = await this.generateInvoiceNumber();

    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber,
        patientId: dto.patientId,
        totalAmount: dto.totalAmount,
        paidAmount: 0,
        status: 'PENDING',
        items: dto.items || [],
        notes: dto.notes?.trim(),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        metadata: dto.metadata ? (dto.metadata as any) : {},
      },
      include: {
        patient: { select: { id: true, patientId: true, name: true } },
        payments: true,
      },
    });

    this.logger.log(`Invoice created: ${invoiceNumber}`);
    return invoice;
  }

  async findAllInvoices(dto: QueryInvoiceDto) {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.InvoiceWhereInput = {};
    if (dto.patientId) where.patientId = dto.patientId;
    if (dto.status) where.status = dto.status as PaymentStatus;

    if (dto.fromDate || dto.toDate) {
      where.createdAt = {};
      if (dto.fromDate) where.createdAt.gte = new Date(dto.fromDate);
      if (dto.toDate) where.createdAt.lte = new Date(dto.toDate);
    }

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { select: { id: true, patientId: true, name: true } },
          _count: { select: { payments: true } },
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      invoices,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOneInvoice(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        patient: { select: { id: true, patientId: true, name: true, phone: true } },
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async updateInvoice(id: string, dto: UpdateInvoiceDto) {
    const existing = await this.findOneInvoice(id);

    if (dto.totalAmount !== undefined && dto.totalAmount <= 0) {
      throw new BadRequestException('Invalid total amount');
    }

    if (dto.totalAmount !== undefined && dto.totalAmount < existing.paidAmount) {
      throw new BadRequestException('Total amount cannot be less than already paid amount');
    }

    const data: Prisma.InvoiceUpdateInput = {};
    if (dto.totalAmount !== undefined) data.totalAmount = dto.totalAmount;
    if (dto.items) data.items = dto.items;
    if (dto.status) data.status = dto.status;
    if (dto.notes !== undefined) data.notes = dto.notes?.trim();
    if (dto.dueDate) data.dueDate = new Date(dto.dueDate);
    if (dto.metadata) data.metadata = dto.metadata as any;

    return this.prisma.invoice.update({
      where: { id },
      data,
      include: { patient: { select: { id: true, patientId: true, name: true } } },
    });
  }

  async addPayment(invoiceId: string, dto: CreatePaymentDto) {
    const invoice = await this.findOneInvoice(invoiceId);

    if (!dto.amount || dto.amount <= 0) {
      throw new BadRequestException('Invalid payment amount');
    }

    if (dto.amount > (invoice.totalAmount - invoice.paidAmount)) {
      throw new BadRequestException('Payment amount exceeds remaining balance');
    }

    const validMethods = ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Wallet', 'Insurance'];
    if (dto.method && !validMethods.includes(dto.method)) {
      throw new BadRequestException('Invalid payment method');
    }

    const payment = await this.prisma.payment.create({
      data: {
        invoiceId,
        amount: dto.amount,
        method: dto.method || 'Cash',
        referenceNo: dto.referenceNo?.trim(),
        notes: dto.notes?.trim(),
        paidAt: new Date(),
        metadata: dto.metadata ? (dto.metadata as any) : {},
      },
    });

    const paidAmount = invoice.paidAmount + dto.amount;
    let status: PaymentStatus = 'PARTIAL';
    if (paidAmount >= invoice.totalAmount) {
      status = 'PAID';
    }

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { paidAmount, status },
    });

    this.logger.log(`Payment of ${dto.amount} added to invoice ${invoice.invoiceNumber}`);
    return payment;
  }

  async getStats() {
    const [pending, partial, paid, overdue] = await Promise.all([
      this.prisma.invoice.findMany({ where: { status: 'PENDING' }, select: { totalAmount: true } }),
      this.prisma.invoice.findMany({ where: { status: 'PARTIAL' }, select: { totalAmount: true, paidAmount: true } }),
      this.prisma.invoice.findMany({ where: { status: 'PAID' }, select: { totalAmount: true } }),
      this.prisma.payment.aggregate({ _sum: { amount: true } }),
    ]);

    const pendingTotal = pending.reduce((s, i) => s + i.totalAmount, 0);
    const partialTotal = partial.reduce((s, i) => s + (i.totalAmount - i.paidAmount), 0);
    const paidTotal = paid.reduce((s, i) => s + i.totalAmount, 0);
    const collectedTotal = overdue._sum.amount || 0;

    return {
      pendingInvoices: pending.length,
      pendingTotal,
      partialInvoices: partial.length,
      partialTotal,
      paidInvoices: paid.length,
      paidTotal,
      collectedTotal,
    };
  }
}