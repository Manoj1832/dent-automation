import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import type { Request } from 'express';

@Injectable()
export class WhatsAppSignatureGuard implements CanActivate {
  private readonly logger = new Logger(WhatsAppSignatureGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const appSecret = process.env.WHATSAPP_APP_SECRET;

    if (!appSecret) {
      this.logger.warn(
        'WHATSAPP_APP_SECRET not set — skipping webhook signature verification (dev mode)',
      );
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const signature = request.headers['x-hub-signature-256'] as string;

    if (!signature) {
      this.logger.error('Missing X-Hub-Signature-256 header');
      throw new UnauthorizedException('Missing webhook signature');
    }

    const rawBody = (request as any).rawBody;
    if (!rawBody) {
      this.logger.error(
        'rawBody not available on request — ensure raw body middleware is configured',
      );
      throw new UnauthorizedException('Cannot verify signature without raw body');
    }

    const expectedSignature =
      'sha256=' +
      createHmac('sha256', appSecret)
        .update(rawBody)
        .digest('hex');

    if (signature.length !== expectedSignature.length) {
      this.logger.error('Invalid webhook signature — length mismatch');
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (!timingSafeEqual(sigBuffer, expectedBuffer)) {
      this.logger.error('Invalid webhook signature — possible spoofing attempt');
      throw new UnauthorizedException('Invalid webhook signature');
    }

    return true;
  }
}