import { Controller, Post, Body, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WhatsAppSenderService } from './whatsapp-sender.service';

@Controller('whatsapp/admin')
@UseGuards(AuthGuard('jwt'))
export class WhatsAppAdminController {
  constructor(private readonly whatsappSender: WhatsAppSenderService) {}

  @Post('bulk-send')
  async bulkSend(
    @Body() body: {
      recipients: string[];
      templateName: string;
      languageCode?: string;
      // In a real implementation, you might pass variables to construct components
      variables?: Record<string, string[]>;
    }
  ) {
    if (!body.recipients || !Array.isArray(body.recipients) || body.recipients.length === 0) {
      throw new HttpException('Recipients array is required and cannot be empty', HttpStatus.BAD_REQUEST);
    }
    if (!body.templateName) {
      throw new HttpException('Template name is required', HttpStatus.BAD_REQUEST);
    }

    const result = await this.whatsappSender.sendBulkTemplate(
      body.recipients,
      body.templateName,
      body.languageCode || 'en'
    );

    return {
      message: `Successfully queued bulk messages.`,
      result
    };
  }
}
