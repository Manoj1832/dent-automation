import { SetMetadata } from '@nestjs/common';

export const LOGIN_RATE_LIMIT = { limit: 5, windowSeconds: 900 };
export const OTP_RATE_LIMIT = { limit: 3, windowSeconds: 60 };
export const AI_RATE_LIMIT = { limit: 10, windowSeconds: 60 };
export const PAYMENT_RATE_LIMIT = { limit: 20, windowSeconds: 60 };

export function RateLimit(key: string, limit: number, windowSeconds: number) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata('rateLimit', { key, limit, windowSeconds })(target, propertyKey, descriptor);
    return descriptor;
  };
}