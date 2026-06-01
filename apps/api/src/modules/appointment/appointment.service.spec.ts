import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PerformanceService } from '../common/performance.service';
import { CacheService } from '../common/cache.service';
import { SlotLockService } from '../slot-lock/slot-lock.service';
import { PriorityQueueService } from './priority-queue.service';

describe('AppointmentService - Concurrency & Double Booking', () => {
  let service: AppointmentService;
  let slotLockService: SlotLockService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    // Mock Prisma Service
    const mockPrismaService = {
      appointment: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation((data) => Promise.resolve({
          id: 'appt-123',
          ...data.data,
          patient: { name: 'Test Patient' },
          doctor: { name: 'Test Doctor' }
        })),
        update: jest.fn(),
      },
      patient: {
        findUnique: jest.fn().mockResolvedValue({ id: 'pat-1' }),
      },
      doctor: {
        findUnique: jest.fn().mockResolvedValue({ id: 'doc-1' }),
      },
    };

    // Mock SlotLockService to simulate a real distributed lock
    // Only the first call for a key should return true, subsequent calls while locked should return false
    const activeLocks = new Set<string>();
    const mockSlotLockService = {
      acquireLock: jest.fn().mockImplementation(async (key: string, ownerId: string, ttl: number) => {
        if (activeLocks.has(key)) {
          return false;
        }
        activeLocks.add(key);
        // Simulate lock TTL expiration if needed for other tests
        setTimeout(() => activeLocks.delete(key), ttl);
        return true;
      }),
      releaseLock: jest.fn().mockImplementation(async (key: string) => {
        activeLocks.delete(key);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PerformanceService, useValue: { logQueryTime: jest.fn() } },
        { provide: CacheService, useValue: { remember: jest.fn((k, ttl, cb) => cb()), invalidate: jest.fn(), invalidatePrefix: jest.fn() } },
        { provide: SlotLockService, useValue: mockSlotLockService },
        { provide: PriorityQueueService, useValue: { enqueue: jest.fn(), removeFromQueue: jest.fn(), getDailyQueue: jest.fn() } },
      ],
    }).compile();

    service = module.get<AppointmentService>(AppointmentService);
    slotLockService = module.get<SlotLockService>(SlotLockService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create - Double Booking Race Condition', () => {
    it('should allow the first booking and reject the second concurrent booking with ConflictException', async () => {
      const dto = {
        doctorId: 'doc-1',
        patientId: 'pat-1',
        date: '2026-10-15T00:00:00.000Z',
        startTime: '2026-10-15T09:00:00.000Z',
        type: 'CHECKUP',
      };

      // Simulate two identical concurrent requests hitting the API at the exact same millisecond
      const request1 = service.create(dto);
      const request2 = service.create(dto);

      // We expect one to succeed and one to fail with ConflictException
      const results = await Promise.allSettled([request1, request2]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);

      if (rejected[0].status === 'rejected') {
        expect(rejected[0].reason).toBeInstanceOf(ConflictException);
        expect(rejected[0].reason.message).toContain('slot is currently being booked');
      }

      // Verify that SlotLockService was called twice for the same key
      const slotKey = `doc-1_${new Date(dto.startTime).getTime()}`;
      expect(slotLockService.acquireLock).toHaveBeenCalledTimes(2);
      expect(slotLockService.acquireLock).toHaveBeenCalledWith(slotKey, 'pat-1', 5000);

      // Verify that DB create was only called once
      expect(prismaService.appointment.create).toHaveBeenCalledTimes(1);
    });

    it('should reject booking if DB re-validation finds an existing appointment (Stolen Slot)', async () => {
      const dto = {
        doctorId: 'doc-1',
        patientId: 'pat-1',
        date: '2026-10-15T00:00:00.000Z',
        startTime: '2026-10-15T09:00:00.000Z',
        type: 'CHECKUP',
      };

      // Mock DB to return an existing appointment during the secondary re-validation check
      (prismaService.appointment.findFirst as jest.Mock)
        .mockResolvedValueOnce(null) // Queue number fetch
        .mockResolvedValueOnce({ id: 'appt-999', status: 'SCHEDULED' }); // Existing appt check

      await expect(service.create(dto)).rejects.toThrow(ConflictException);

      // Lock should have been acquired but DB insertion never happens
      expect(slotLockService.acquireLock).toHaveBeenCalledTimes(1);
      expect(prismaService.appointment.create).not.toHaveBeenCalled();
    });
  });
});
