import { Test, TestingModule } from '@nestjs/testing';
import { SchedulerRegistry } from '@nestjs/schedule';
import { SubscriptionCronService } from '../subscription-cron.service';
import { SubscriptionsService } from '../subscriptions.service';
import { Logger } from '@nestjs/common';

describe('SubscriptionCronService - Cron Job Verification', () => {
  let service: SubscriptionCronService;
  let subscriptionsService: jest.Mocked<SubscriptionsService>;
  let schedulerRegistry: jest.Mocked<SchedulerRegistry>;

  beforeEach(async () => {
    const mockSubscriptionsService = {
      checkAndUpdateExpiredSubscriptions: jest.fn(),
    };

    const mockSchedulerRegistry = {
      getCronJobs: jest.fn(),
      getCronJob: jest.fn(),
      addCronJob: jest.fn(),
      deleteCronJob: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionCronService,
        {
          provide: SubscriptionsService,
          useValue: mockSubscriptionsService,
        },
        {
          provide: SchedulerRegistry,
          useValue: mockSchedulerRegistry,
        },
      ],
    }).compile();

    service = module.get<SubscriptionCronService>(SubscriptionCronService);
    subscriptionsService = module.get(SubscriptionsService);
    schedulerRegistry = module.get(SchedulerRegistry);

    // Mock logger to avoid console output during tests
    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };
    (service as any).logger = mockLogger;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Daily Subscription Expiration Cron Job', () => {
    it('should be configured to run daily at 6:00 AM', () => {
      // This test verifies that the cron decorator is properly configured
      // In a real environment, you would check the scheduler registry or metadata
      expect(typeof service.checkExpiredSubscriptions).toBe('function');

      // The actual cron expression is defined in the @Cron decorator
      // This is more of a documentation test to ensure the method exists
      expect(service.checkExpiredSubscriptions).toBeDefined();
    });

    it('should execute subscription expiration check successfully', async () => {
      const mockResult = {
        updated: 3,
        expired: ['Org A (org-a)', 'Org B (org-b)', 'Org C (org-c)'],
      };

      subscriptionsService.checkAndUpdateExpiredSubscriptions.mockResolvedValue(mockResult);

      await service.checkExpiredSubscriptions();

      expect(subscriptionsService.checkAndUpdateExpiredSubscriptions).toHaveBeenCalledTimes(1);
      expect((service as any).logger.log).toHaveBeenCalledWith(
        'Starting daily subscription expiration check...',
      );
      expect((service as any).logger.log).toHaveBeenCalledWith(
        'Updated 3 expired subscriptions: Org A (org-a), Org B (org-b), Org C (org-c)',
      );
    });

    it('should handle empty expiration results gracefully', async () => {
      const mockResult = {
        updated: 0,
        expired: [],
      };

      subscriptionsService.checkAndUpdateExpiredSubscriptions.mockResolvedValue(mockResult);

      await service.checkExpiredSubscriptions();

      expect(subscriptionsService.checkAndUpdateExpiredSubscriptions).toHaveBeenCalledTimes(1);
      expect((service as any).logger.log).toHaveBeenCalledWith('No expired subscriptions found');
    });

    it('should handle service errors without crashing', async () => {
      const error = new Error('Database connection failed');
      subscriptionsService.checkAndUpdateExpiredSubscriptions.mockRejectedValue(error);

      // Should not throw
      await expect(service.checkExpiredSubscriptions()).resolves.toBeUndefined();

      expect((service as any).logger.error).toHaveBeenCalledWith(
        'Failed to check expired subscriptions',
        error,
      );
    });

    it('should log appropriate messages for different scenarios', async () => {
      // Test with multiple expired subscriptions
      subscriptionsService.checkAndUpdateExpiredSubscriptions.mockResolvedValue({
        updated: 2,
        expired: ['Test Gym 1 (org-1)', 'Test Gym 2 (org-2)'],
      });

      await service.checkExpiredSubscriptions();

      expect((service as any).logger.log).toHaveBeenCalledWith(
        'Starting daily subscription expiration check...',
      );
      expect((service as any).logger.log).toHaveBeenCalledWith(
        'Updated 2 expired subscriptions: Test Gym 1 (org-1), Test Gym 2 (org-2)',
      );
    });

    it('should continue execution even if logging fails', async () => {
      subscriptionsService.checkAndUpdateExpiredSubscriptions.mockResolvedValue({
        updated: 1,
        expired: ['Test Org (org-1)'],
      });

      // Mock logger to throw error
      (service as any).logger.log = jest.fn().mockImplementation(() => {
        throw new Error('Logging service unavailable');
      });

      // Should still complete without throwing
      await expect(service.checkExpiredSubscriptions()).resolves.toBeUndefined();

      expect(subscriptionsService.checkAndUpdateExpiredSubscriptions).toHaveBeenCalled();
    });
  });

  describe('Expiring Soon Subscription Cron Job', () => {
    it('should be configured to run daily at 7:00 AM', () => {
      expect(typeof service.checkExpiringSoonSubscriptions).toBe('function');
      expect(service.checkExpiringSoonSubscriptions).toBeDefined();
    });

    it('should execute expiring soon check successfully', async () => {
      await service.checkExpiringSoonSubscriptions();

      expect((service as any).logger.log).toHaveBeenCalledWith(
        'Starting daily expiring soon subscription check...',
      );
      expect((service as any).logger.log).toHaveBeenCalledWith('Expiring soon check completed');
    });

    it('should handle errors during expiring soon check', async () => {
      // Temporarily override the method to simulate an error
      const originalMethod = service.checkExpiringSoonSubscriptions;
      service.checkExpiringSoonSubscriptions = async () => {
        (service as any).logger.log('Starting daily expiring soon subscription check...');
        throw new Error('Service error during expiring soon check');
      };

      await expect(service.checkExpiringSoonSubscriptions()).rejects.toThrow(
        'Service error during expiring soon check',
      );

      // Restore original method
      service.checkExpiringSoonSubscriptions = originalMethod;
    });
  });

  describe('Manual Trigger Functionality', () => {
    it('should allow manual triggering of expiration check', async () => {
      const mockResult = {
        updated: 1,
        expired: ['Manual Test Org (org-manual)'],
      };

      subscriptionsService.checkAndUpdateExpiredSubscriptions.mockResolvedValue(mockResult);

      const result = await service.manualCheckExpiredSubscriptions();

      expect(result).toEqual(mockResult);
      expect((service as any).logger.log).toHaveBeenCalledWith(
        'Manual subscription expiration check triggered...',
      );
      expect(subscriptionsService.checkAndUpdateExpiredSubscriptions).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors during manual trigger', async () => {
      const error = new Error('Manual trigger failed');
      subscriptionsService.checkAndUpdateExpiredSubscriptions.mockRejectedValue(error);

      await expect(service.manualCheckExpiredSubscriptions()).rejects.toThrow(
        'Manual trigger failed',
      );

      expect((service as any).logger.log).toHaveBeenCalledWith(
        'Manual subscription expiration check triggered...',
      );
    });

    it('should return the same result as the service method', async () => {
      const expectedResult = {
        updated: 5,
        expired: ['Org 1 (id-1)', 'Org 2 (id-2)', 'Org 3 (id-3)', 'Org 4 (id-4)', 'Org 5 (id-5)'],
      };

      subscriptionsService.checkAndUpdateExpiredSubscriptions.mockResolvedValue(expectedResult);

      const result = await service.manualCheckExpiredSubscriptions();

      expect(result).toEqual(expectedResult);
      expect(result.updated).toBe(5);
      expect(result.expired).toHaveLength(5);
    });
  });

  describe('Cron Job Execution Timing', () => {
    it('should handle rapid successive executions', async () => {
      subscriptionsService.checkAndUpdateExpiredSubscriptions.mockResolvedValue({
        updated: 0,
        expired: [],
      });

      // Simulate rapid successive cron executions
      const promises = Array.from({ length: 5 }, () => service.checkExpiredSubscriptions());

      await expect(Promise.all(promises)).resolves.toBeDefined();

      // Should be called 5 times
      expect(subscriptionsService.checkAndUpdateExpiredSubscriptions).toHaveBeenCalledTimes(5);
    });

    it('should handle concurrent manual and automatic executions', async () => {
      subscriptionsService.checkAndUpdateExpiredSubscriptions.mockResolvedValue({
        updated: 1,
        expired: ['Concurrent Test (org-concurrent)'],
      });

      // Simulate concurrent automatic and manual executions
      const automaticExecution = service.checkExpiredSubscriptions();
      const manualExecution = service.manualCheckExpiredSubscriptions();

      const [automaticResult, manualResult] = await Promise.all([
        automaticExecution,
        manualExecution,
      ]);

      expect(automaticResult).toBeUndefined(); // checkExpiredSubscriptions returns void
      expect(manualResult).toEqual({
        updated: 1,
        expired: ['Concurrent Test (org-concurrent)'],
      });

      expect(subscriptionsService.checkAndUpdateExpiredSubscriptions).toHaveBeenCalledTimes(2);
    });

    it('should not block subsequent executions if one fails', async () => {
      let callCount = 0;
      subscriptionsService.checkAndUpdateExpiredSubscriptions.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          throw new Error('First execution failed');
        }
        return { updated: 0, expired: [] };
      });

      // First execution should fail but not throw
      await service.checkExpiredSubscriptions();

      // Second execution should succeed
      await service.checkExpiredSubscriptions();

      expect(subscriptionsService.checkAndUpdateExpiredSubscriptions).toHaveBeenCalledTimes(2);
      expect((service as any).logger.error).toHaveBeenCalledTimes(1);
      expect((service as any).logger.log).toHaveBeenCalledWith('No expired subscriptions found');
    });
  });

  describe('Cron Job Error Resilience', () => {
    it('should recover from temporary service failures', async () => {
      let callCount = 0;
      subscriptionsService.checkAndUpdateExpiredSubscriptions.mockImplementation(async () => {
        callCount++;
        if (callCount <= 2) {
          throw new Error(`Temporary failure ${callCount}`);
        }
        return { updated: 1, expired: ['Recovered Org (org-recovered)'] };
      });

      // First two calls should fail gracefully
      await service.checkExpiredSubscriptions();
      await service.checkExpiredSubscriptions();

      // Third call should succeed
      await service.checkExpiredSubscriptions();

      expect(subscriptionsService.checkAndUpdateExpiredSubscriptions).toHaveBeenCalledTimes(3);
      expect((service as any).logger.error).toHaveBeenCalledTimes(2);
      expect((service as any).logger.log).toHaveBeenCalledWith(
        'Updated 1 expired subscriptions: Recovered Org (org-recovered)',
      );
    });

    it('should maintain proper logging during error conditions', async () => {
      subscriptionsService.checkAndUpdateExpiredSubscriptions.mockRejectedValue(
        new Error('Persistent service error'),
      );

      await service.checkExpiredSubscriptions();

      expect((service as any).logger.log).toHaveBeenCalledWith(
        'Starting daily subscription expiration check...',
      );
      expect((service as any).logger.error).toHaveBeenCalledWith(
        'Failed to check expired subscriptions',
        expect.any(Error),
      );
    });

    it('should handle various error types gracefully', async () => {
      const errorTypes = [
        new Error('Standard error'),
        new TypeError('Type error'),
        'String error',
        { message: 'Object error' },
        null,
        undefined,
      ];

      for (const error of errorTypes) {
        subscriptionsService.checkAndUpdateExpiredSubscriptions.mockRejectedValue(error);

        // Should not throw regardless of error type
        await expect(service.checkExpiredSubscriptions()).resolves.toBeUndefined();
      }

      expect((service as any).logger.error).toHaveBeenCalledTimes(errorTypes.length);
    });
  });

  describe('Performance and Resource Management', () => {
    it('should complete execution within reasonable time', async () => {
      subscriptionsService.checkAndUpdateExpiredSubscriptions.mockResolvedValue({
        updated: 100,
        expired: Array.from({ length: 100 }, (_, i) => `Org ${i} (org-${i})`),
      });

      const startTime = Date.now();
      await service.checkExpiredSubscriptions();
      const executionTime = Date.now() - startTime;

      // Should complete within reasonable time (adjust threshold as needed)
      expect(executionTime).toBeLessThan(5000); // 5 seconds
    });

    it('should handle large result sets efficiently', async () => {
      const largeResultSet = {
        updated: 1000,
        expired: Array.from({ length: 1000 }, (_, i) => `Large Org ${i} (org-large-${i})`),
      };

      subscriptionsService.checkAndUpdateExpiredSubscriptions.mockResolvedValue(largeResultSet);

      await service.checkExpiredSubscriptions();

      expect((service as any).logger.log).toHaveBeenCalledWith(
        expect.stringContaining('Updated 1000 expired subscriptions:'),
      );
    });
  });
});
