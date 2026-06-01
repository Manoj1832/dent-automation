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
import { BillingService } from './billing.service';
import { CreateInvoiceDto, UpdateInvoiceDto, CreatePaymentDto, QueryInvoiceDto } from './dto';
import { PAYMENT_RATE_LIMIT, RateLimit } from '../rate-limiter/rate-limit.decorator';

@Controller('billing')
@UseGuards(AuthGuard('jwt'))
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('invoices')
  @RateLimit('create_invoice', PAYMENT_RATE_LIMIT.limit, PAYMENT_RATE_LIMIT.windowSeconds)
  async createInvoice(@Body() dto: CreateInvoiceDto) {
    return this.billingService.createInvoice(dto);
  }

  @Get('invoices')
  async findAllInvoices(@Query() dto: QueryInvoiceDto) {
    return this.billingService.findAllInvoices(dto);
  }

  @Get('invoices/stats')
  async getStats() {
    return this.billingService.getStats();
  }

  @Get('invoices/:id')
  async findOneInvoice(@Param('id') id: string) {
    return this.billingService.findOneInvoice(id);
  }

  @Put('invoices/:id')
  async updateInvoice(@Param('id') id: string, @Body() dto: UpdateInvoiceDto) {
    return this.billingService.updateInvoice(id, dto);
  }

  @Post('invoices/:id/payments')
  @RateLimit('add_payment', PAYMENT_RATE_LIMIT.limit, PAYMENT_RATE_LIMIT.windowSeconds)
  async addPayment(@Param('id') invoiceId: string, @Body() dto: CreatePaymentDto) {
    return this.billingService.addPayment(invoiceId, dto);
  }
}