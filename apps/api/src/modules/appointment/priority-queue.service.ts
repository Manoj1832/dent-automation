import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PriorityQueueService implements OnModuleInit {
  private redis: Redis | null = null;
  private readonly logger = new Logger(PriorityQueueService.name);

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      try {
        this.redis = new Redis(redisUrl, {
          maxRetriesPerRequest: 1,
        });
        this.logger.log('Priority Queue Service connected to Redis');
      } catch (e) {
        this.logger.warn('Priority Queue Service Redis connection failed, falling back to SQL');
      }
    }
  }

  private getQueueKey(doctorId: string, dateStr: string) {
    return `clinic_queue:${doctorId}:${dateStr}`;
  }

  /**
   * Adds an appointment to the doctor's realtime priority queue.
   * Priority score is calculated based on appointment time and modifiers (emergencies).
   */
  async enqueue(appointmentId: string, doctorId: string, dateStr: string, timestamp: number, isEmergency: boolean = false) {
    if (!this.redis) return;

    // Lower score means higher priority. Emergencies skip to the front (subtract 1 day from timestamp score)
    const score = isEmergency ? timestamp - 86400000 : timestamp;
    const key = this.getQueueKey(doctorId, dateStr);

    await this.redis.zadd(key, score, appointmentId);
    this.logger.debug(`Enqueued ${appointmentId} to ${key} with priority ${score}`);
  }

  /**
   * Pops the next patient in line for a specific doctor.
   * Operates in O(log(N)) time.
   */
  async dequeueNext(doctorId: string): Promise<string | null> {
    if (!this.redis) return null;

    const todayStr = new Date().toISOString().split('T')[0];
    const key = this.getQueueKey(doctorId, todayStr);

    // Get the element with the lowest score (highest priority) and remove it
    const result = await this.redis.zpopmin(key);
    if (!result || result.length === 0) return null;

    const appointmentId = result[0];
    this.logger.log(`Dequeued next patient for doctor ${doctorId}: Appointment ${appointmentId}`);
    return appointmentId;
  }

  /**
   * Retrieve the current queue for a doctor without removing them.
   * Operates in O(log(N) + M) time where M is the number of elements returned.
   */
  async getQueue(doctorId: string): Promise<string[]> {
    if (!this.redis) return [];

    const todayStr = new Date().toISOString().split('T')[0];
    const key = this.getQueueKey(doctorId, todayStr);

    // Returns ordered array of appointment IDs
    return await this.redis.zrange(key, 0, -1);
  }

  /**
   * If a doctor is delayed, we don't need to update every row in SQL.
   * We just update the queue metadata in Redis for frontend polling.
   */
  async setDoctorDelay(doctorId: string, delayMinutes: number) {
    if (!this.redis) return;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const delayKey = `clinic_delay:${doctorId}:${todayStr}`;
    
    // Set delay for 12 hours
    await this.redis.set(delayKey, delayMinutes, 'EX', 43200);
    this.logger.warn(`Doctor ${doctorId} is delayed by ${delayMinutes} minutes`);
  }

  async getDoctorDelay(doctorId: string): Promise<number> {
    if (!this.redis) return 0;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const delayKey = `clinic_delay:${doctorId}:${todayStr}`;
    
    const delay = await this.redis.get(delayKey);
    return delay ? parseInt(delay, 10) : 0;
  }
}
