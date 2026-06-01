import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Req,
  Res,
  HttpStatus,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppWebhookDto } from './dto/webhook.dto';
import { WhatsAppSignatureGuard } from './guards/whatsapp-signature.guard';
import type { Request, Response } from 'express';

@Controller('whatsapp/webhook')
export class WhatsAppController {
  private readonly logger = new Logger(WhatsAppController.name);

  constructor(private readonly whatsappService: WhatsAppService) {}

  /**
   * Meta Webhook Verification Endpoint
   * Meta sends a GET request here when you set up the webhook in the App Dashboard.
   */
  @Get()
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    try {
      const responseChallenge = this.whatsappService.verifyWebhook(
        mode,
        token,
        challenge,
      );
      return res.status(HttpStatus.OK).send(responseChallenge);
    } catch (error) {
      this.logger.error(`Webhook verification failed: ${error.message}`);
      return res.status(HttpStatus.FORBIDDEN).send('Verification failed');
    }
  }

  /**
   * Meta Webhook Event Endpoint
   *
   * Critical production rules:
   * 1. ALWAYS respond 200 OK immediately — Meta retries on non-200 and will
   *    eventually disable the webhook after repeated failures.
   * 2. ALL heavy processing happens asynchronously after the response.
   * 3. The signature guard validates X-Hub-Signature-256 before this runs.
   */
  @Post()
  @UseGuards(WhatsAppSignatureGuard)
  async receiveWebhook(
    @Body() dto: WhatsAppWebhookDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // Respond to Meta IMMEDIATELY — this is non-negotiable
    res.status(HttpStatus.OK).send('EVENT_RECEIVED');

    // Process asynchronously — errors are caught and logged, never bubble up
    try {
      if (dto.object === 'whatsapp_business_account') {
        await this.whatsappService.processWebhook(dto);
      }
    } catch (error) {
      this.logger.error(
        `Webhook async processing error: ${error.message}`,
        error.stack,
      );
    }
  }
}
