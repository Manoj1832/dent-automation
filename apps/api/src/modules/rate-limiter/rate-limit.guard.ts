import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimiterService } from './rate-limiter.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(
    private reflector: Reflector,
    private rateLimiter: RateLimiterService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rateLimitConfig = this.reflector.get<{ key: string; limit: number; windowSeconds: number }>(
      'rateLimit',
      context.getHandler(),
    );

    if (!rateLimitConfig) return true;

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const ip = request.ip || request.headers['x-forwarded-for'] || 'unknown';
    const identifier = request.body?.phone || request.body?.email || request.user?.id || 'anonymous';

    const key = `rate_limit:${rateLimitConfig.key}:${ip}:${identifier}`;
    const result = await this.rateLimiter.checkRateLimit(
      key,
      rateLimitConfig.limit,
      rateLimitConfig.windowSeconds,
    );

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
      throw new HttpException(
        {
          success: false,
          message: `Too many requests. Try again in ${retryAfter} seconds.`,
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    response.setHeader('X-RateLimit-Limit', rateLimitConfig.limit);
    response.setHeader('X-RateLimit-Remaining', result.remaining);
    response.setHeader('X-RateLimit-Reset', Math.ceil(result.resetAt / 1000));

    return true;
  }
}