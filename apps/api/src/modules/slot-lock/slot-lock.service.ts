import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject, Optional } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../common/redis.module';

interface LockEntry {
  appointmentId: string;
  expiresAt: number;
}

@Injectable()
export class SlotLockService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SlotLockService.name);
  private locks = new Map<string, LockEntry>();
  private redis: Redis | null = null;
  private isRedisReady = false;

  constructor(
    @Inject(REDIS_CLIENT) @Optional() sharedRedis: Redis | null,
  ) {
    this.redis = sharedRedis;
    if (this.redis) {
      this.isRedisReady = true;
    }
  }

  onModuleInit() {
    if (this.isRedisReady) {
      this.logger.log('SlotLock using shared Redis (distributed locking enabled)');
    } else {
      this.logger.warn('SlotLock: no shared Redis — using in-memory locks (single-instance only)');
    }
  }

  onModuleDestroy() {
    // No-op: shared Redis managed by RedisModule
  }

  async acquireLock(slotKey: string, appointmentId: string, ttlMs: number = 300000): Promise<boolean> {
    if (this.isRedisReady && this.redis) {
      const result = await this.redis.set(`slot_lock:${slotKey}`, appointmentId, 'PX', ttlMs, 'NX');
      return result === 'OK';
    }

    // Fallback Memory Mode
    const existing = this.locks.get(slotKey);
    if (existing && existing.expiresAt > Date.now()) {
      return false;
    }
    this.locks.set(slotKey, { appointmentId, expiresAt: Date.now() + ttlMs });
    return true;
  }

  async releaseLock(slotKey: string, appointmentId: string): Promise<boolean> {
    if (this.isRedisReady && this.redis) {
      // Lua script to ensure we only delete OUR lock, not someone else's who acquired it after ours expired
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      const result = await this.redis.eval(script, 1, `slot_lock:${slotKey}`, appointmentId);
      return result === 1;
    }

    // Fallback Memory Mode
    const existing = this.locks.get(slotKey);
    if (existing && existing.appointmentId === appointmentId) {
      return this.locks.delete(slotKey);
    }
    return false;
  }

  async isLocked(slotKey: string): Promise<boolean> {
    if (this.isRedisReady && this.redis) {
      const exists = await this.redis.exists(`slot_lock:${slotKey}`);
      return exists === 1;
    }

    // Fallback Memory Mode
    const entry = this.locks.get(slotKey);
    if (!entry) return false;
    if (entry.expiresAt <= Date.now()) {
      this.locks.delete(slotKey);
      return false;
    }
    return true;
  }

  @Cron('0 * * * * *') // Run every minute
  async cleanupExpiredLocks() {
    if (this.isRedisReady) return; // Redis handles TTL automatically

    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of this.locks.entries()) {
      if (entry.expiresAt <= now) {
        this.locks.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      this.logger.debug(`Cleaned up ${cleaned} expired memory slot locks`);
    }
  }
}

