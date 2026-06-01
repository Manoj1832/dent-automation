import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit {
  private redis: Redis | null = null;
  private readonly logger = new Logger(CacheService.name);

  // In-memory LRU fallback when Redis is unavailable
  private memCache = new Map<string, { value: string; expiresAt: number }>();
  private readonly MEM_MAX_KEYS = 200;

  onModuleInit() {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      try {
        this.redis = new Redis(redisUrl, {
          maxRetriesPerRequest: 1,
          enableReadyCheck: false,
          lazyConnect: false,
          retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 2000)),
        });
        this.redis.on('ready', () => this.logger.log('CacheService Redis connected'));
        this.redis.on('error', (err) => {
          this.logger.warn(`Cache Redis error (in-memory fallback): ${err.message}`);
          this.redis = null;
        });
      } catch {
        this.logger.warn('Cache Redis init failed — using in-memory fallback');
      }
    } else {
      this.logger.warn('REDIS_URL not set — using in-memory cache only');
    }
  }

  /**
   * Get-or-set cache.
   * If the key exists in cache, returns it instantly (O(1)).
   * If not, executes the factory fn, caches the result, and returns it.
   */
  async remember<T>(key: string, ttlSeconds: number, factory: () => Promise<T>): Promise<T> {
    // --- Redis path ---
    if (this.redis) {
      try {
        const cached = await this.redis.get(key);
        if (cached) {
          this.logger.debug(`[CACHE HIT] ${key}`);
          return JSON.parse(cached) as T;
        }
        const result = await factory();
        await this.redis.set(key, JSON.stringify(result), 'EX', ttlSeconds);
        this.logger.debug(`[CACHE SET] ${key} (TTL: ${ttlSeconds}s)`);
        return result;
      } catch (err) {
        this.logger.warn(`Cache Redis error on get/set for ${key}: ${err.message}`);
        // fall through to factory
      }
    }

    // --- In-memory LRU fallback ---
    const now = Date.now();
    const entry = this.memCache.get(key);
    if (entry && entry.expiresAt > now) {
      this.logger.debug(`[MEM CACHE HIT] ${key}`);
      return JSON.parse(entry.value) as T;
    }

    const result = await factory();
    const serialized = JSON.stringify(result);

    // LRU eviction: if map is full, delete oldest entries
    if (this.memCache.size >= this.MEM_MAX_KEYS) {
      const firstKey = this.memCache.keys().next().value;
      this.memCache.delete(firstKey);
    }
    this.memCache.set(key, { value: serialized, expiresAt: now + ttlSeconds * 1000 });
    return result;
  }

  /**
   * Invalidate one key or a key pattern prefix.
   * Call this whenever the underlying data changes (create/update/delete).
   */
  async invalidate(keyOrPrefix: string): Promise<void> {
    // In-memory invalidation (always run)
    for (const key of this.memCache.keys()) {
      if (key.startsWith(keyOrPrefix)) {
        this.memCache.delete(key);
      }
    }

    if (!this.redis) return;

    try {
      const pattern = `${keyOrPrefix}*`;
      let cursor = '0';
      do {
        const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        if (keys.length > 0) {
          await this.redis.del(...keys);
          this.logger.debug(`[CACHE INVALIDATED] ${keys.length} keys matching "${pattern}"`);
        }
      } while (cursor !== '0');
    } catch (err) {
      this.logger.warn(`Cache invalidation error: ${err.message}`);
    }
  }
}
