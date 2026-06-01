import { Module, Global, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (): Redis | null => {
        const logger = new Logger('RedisModule');
        const redisUrl = process.env.REDIS_URL;

        if (!redisUrl) {
          logger.warn('REDIS_URL not set — Redis features disabled');
          return null;
        }

        try {
          const redis = new Redis(redisUrl, {
            maxRetriesPerRequest: 1,
            enableReadyCheck: false,
            lazyConnect: false,
            retryStrategy: (times: number) => {
              if (times > 3) return null;
              return Math.min(times * 200, 3000);
            },
          });

          redis.on('ready', () => logger.log('Redis connected'));
          redis.on('error', (err: Error) => logger.warn('Redis error: ' + err.message));

          return redis;
        } catch (err) {
          logger.warn('Redis connection failed: ' + (err as Error).message);
          return null;
        }
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnModuleDestroy {
  private readonly logger = new Logger(RedisModule.name);

  onModuleDestroy() {
    this.logger.log('RedisModule shutting down');
  }
}