import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RateLimiterService implements OnModuleInit {
  private redis: Redis;
  private readonly logger = new Logger(RateLimiterService.name);

  async onModuleInit() {
    // REDIS_URL should be a rediss:// or redis:// URL (not the Upstash REST HTTP URL)
    // e.g. rediss://default:<token>@<host>.upstash.io:6379
    const redisUrl = process.env.REDIS_URL;

    if (redisUrl) {
      try {
        this.redis = new Redis(redisUrl, {
          maxRetriesPerRequest: 1,
          enableReadyCheck: false,
          lazyConnect: false,
          retryStrategy: (times: number) => {
            if (times > 3) return null;
            return Math.min(times * 200, 3000);
          },
        });

        this.redis.on('error', (err) => {
          this.logger.warn(`Redis error (rate limiter disabled): ${err.message}`);
          this.redis = null as any;
        });

        this.logger.log('Rate limiter Redis connected');
      } catch {
        this.logger.warn('Redis connection failed - rate limiting disabled');
        this.redis = null as any;
      }
    } else {
      this.logger.warn('REDIS_URL not set - rate limiting disabled');
    }
  }

  async checkRateLimit(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    if (!this.redis) {
      return { allowed: true, remaining: limit, resetAt: Date.now() + windowSeconds * 1000 };
    }

    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    try {
      const count = await this.redis.zcount(key, windowStart, now);
      const remaining = Math.max(0, limit - count);
      const resetAt = now + windowSeconds * 1000;

      if (count >= limit) {
        const ttl = await this.redis.ttl(key);
        return { allowed: false, remaining: 0, resetAt: now + (ttl > 0 ? ttl * 1000 : windowSeconds * 1000) };
      }

      await this.redis.zadd(key, now, `${now}:${Math.random()}`);
      await this.redis.expire(key, windowSeconds);

      return { allowed: true, remaining: remaining - 1, resetAt };
    } catch (error) {
      this.logger.error(`Rate limit check failed: ${error.message}`);
      return { allowed: true, remaining: limit, resetAt: now + windowSeconds * 1000 };
    }
  }

  async incrementCounter(key: string, ttlSeconds: number): Promise<number> {
    if (!this.redis) return 0;

    try {
      const count = await this.redis.incr(key);
      if (count === 1) {
        await this.redis.expire(key, ttlSeconds);
      }
      return count;
    } catch (error) {
      this.logger.error(`Counter increment failed: ${error.message}`);
      return 0;
    }
  }

  async getRemaining(key: string): Promise<number> {
    if (!this.redis) return 0;

    try {
      const ttl = await this.redis.ttl(key);
      if (ttl <= 0) return 0;

      const count = await this.redis.get(key);
      return count ? parseInt(count) : 0;
    } catch {
      return 0;
    }
  }

  async resetKey(key: string): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Reset key failed: ${error.message}`);
    }
  }
}