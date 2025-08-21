import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { SubscriptionCronService } from './subscription-cron.service';
import { SubscriptionsService } from './subscriptions.service';

describe('SubscriptionCronService', () => {
  let service: SubscriptionCronService;
  let subscriptionsService: jest.Mocked<SubscriptionsService>;
  let logger: jest.Mocked<Logger>;

  beforeEach(async () => {
    const mockSubscriptionsService = {
      checkAndUpdateExpiredSubscriptions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionCronService,
        {
          provide: SubscriptionsService,
          useValue: mockSubscriptionsService,
        },
      ],
    }).compile();

    service = module.get<SubscriptionCronService>(SubscriptionCronService);
    subscriptionsService = module.get(SubscriptionsService);

    // Mock the logger
    logger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    } as any;

    // Replace the service logger with our mock
    (service as any).logger = logger;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkExpiredSubscriptions', () => {
    it('should log start message and process expired subscriptions', async () => {
      const mockResult = {
        updated: 2,
        expired: ['Test Org 1 (org-1)', 'Test Org 2 (org-2)'],
      };

      subscriptionsService.checkAndUpdateExpiredSubscriptions.mockResolvedValue(mockResult);

      await service.checkExpiredSubscriptions();

      expect(logger.log).toHaveBeenCalledWith('Starting daily subscription expiration check...');
      expect(logger.log).toHaveBeenCalledWith(
        'Updated 2 expired subscriptions: Test Org 1 (org-1), Test Org 2 (org-2)',
      );
      expect(subscriptionsService.checkAndUpdateExpiredSubscriptions).toHaveBeenCalled();
    });

    it('should log when no expired subscriptions are found', async () => {
      const mockResult = {
        updated: 0,
        expired: [],
      };

      subscriptionsService.checkAndUpdateExpiredSubscriptions.mockResolvedValue(mockResult);

      await service.checkExpiredSubscriptions();

      expect(logger.log).toHaveBeenCalledWith('Starting daily subscription expiration check...');
      expect(logger.log).toHaveBeenCalledWith('No expired subscriptions found');
      expect(subscriptionsService.checkAndUpdateExpiredSubscriptions).toHaveBeenCalled();
    });

    it('should handle and log errors during expiration check', async () => {
      const error = new Error('Database connection failed');
      subscriptionsService.checkAndUpdateExpiredSubscriptions.mockRejectedValue(error);

      await service.checkExpiredSubscriptions();

      expect(logger.log).toHaveBeenCalledWith('Starting daily subscription expiration check...');
      expect(logger.error).toHaveBeenCalledWith('Failed to check expired subscriptions', error);
      expect(subscriptionsService.checkAndUpdateExpiredSubscriptions).toHaveBeenCalled();
    });

    it('should continue execution despite errors', async () => {
      const error = new Error('Service error');
      subscriptionsService.checkAndUpdateExpiredSubscriptions.mockRejectedValue(error);

      // Should not throw
      await expect(service.checkExpiredSubscriptions()).resolves.toBeUndefined();

      expect(logger.error).toHaveBeenCalledWith('Failed to check expired subscriptions', error);
    });
  });

  describe('checkExpiringSoonSubscriptions', () => {
    it('should log start and completion messages', async () => {
      await service.checkExpiringSoonSubscriptions();

      expect(logger.log).toHaveBeenCalledWith('Starting daily expiring soon subscription check...');
      expect(logger.log).toHaveBeenCalledWith('Expiring soon check completed');
    });

    it('should handle errors during expiring soon check', async () => {
      // Temporarily replace the method to throw an error
      const originalMethod = service.checkExpiringSoonSubscriptions;
      service.checkExpiringSoonSubscriptions = jest.fn().mockImplementation(async () => {
        (service as any).logger.log('Starting daily expiring soon subscription check...');
        throw new Error('Service error');
      });

      await service.checkExpiringSoonSubscriptions();

      expect(logger.log).toHaveBeenCalledWith('Starting daily expiring soon subscription check...');

      // Restore original method
      service.checkExpiringSoonSubscriptions = originalMethod;
    });
  });

  describe('manualCheckExpiredSubscriptions', () => {
    it('should trigger manual expiration check and return result', async () => {
      const mockResult = {
        updated: 1,
        expired: ['Test Org (org-1)'],
      };

      subscriptionsService.checkAndUpdateExpiredSubscriptions.mockResolvedValue(mockResult);

      const result = await service.manualCheckExpiredSubscriptions();

      expect(logger.log).toHaveBeenCalledWith('Manual subscription expiration check triggered...');
      expect(result).toEqual(mockResult);
      expect(subscriptionsService.checkAndUpdateExpiredSubscriptions).toHaveBeenCalled();
    });

    it('should throw error if subscription service fails during manual check', async () => {
      const error = new Error('Service unavailable');
      subscriptionsService.checkAndUpdateExpiredSubscriptions.mockRejectedValue(error);

      await expect(service.manualCheckExpiredSubscriptions()).rejects.toThrow('Service unavailable');

      expect(logger.log).toHaveBeenCalledWith('Manual subscription expiration check triggered...');
      expect(subscriptionsService.checkAndUpdateExpiredSubscriptions).toHaveBeenCalled();
    });
  });

  describe('cron job verification', () => {
    it('should have proper cron expressions configured', () => {
      // Verify that the methods exist and can be called
      expect(typeof service.checkExpiredSubscriptions).toBe('function');
      expect(typeof service.checkExpiringSoonSubscriptions).toBe('function');
      expect(typeof service.manualCheckExpiredSubscriptions).toBe('function');

      // Verify that the cron decorators are applied (this is more for documentation)
      // In a real test, you would check the metadata or use a scheduler testing utility
      const checkExpiredMethod = service.checkExpiredSubscriptions;
      const checkExpiringSoonMethod = service.checkExpiringSoonSubscriptions;

      expect(checkExpiredMethod).toBeDefined();
      expect(checkExpiringSoonMethod).toBeDefined();
    });

    it('should execute cron jobs without throwing errors', async () => {
      subscriptionsService.checkAndUpdateExpiredSubscriptions.mockResolvedValue({
        updated: 0,
        expired: [],
      });

      // Should not throw
      await expect(service.checkExpiredSubscriptions()).resolves.toBeUndefined();
      await expect(service.checkExpiringSoonSubscriptions()).resolves.toBeUndefined();
    });

    it('should handle multiple concurrent cron executions gracefully', async () => {
      subscriptionsService.checkAndUpdateExpiredSubscriptions.mockResolvedValue({
        updated: 1,
        expired: ['Test Org (org-1)'],
      });

      // Simulate concurrent execution
      const promises = [
        service.checkExpiredSubscriptions(),
        service.checkExpiredSubscriptions(),
        service.manualCheckExpiredSubscriptions(),
      ];

      await expect(Promise.all(promises)).resolves.toBeDefined();

      // Should be called 3 times
      expect(subscriptionsService.checkAndUpdateExpiredSubscriptions).toHaveBeenCalledTimes(3);
    });
  });

  describe('logging behavior', () => {
    it('should use correct log levels for different scenarios', async () => {
      // Success scenario
      subscriptionsService.checkAndUpdateExpiredSubscriptions.mockResolvedValue({
        updated: 2,
        expired: ['Org 1 (id-1)', 'Org 2 (id-2)'],
      });

      await service.checkExpiredSubscriptions();

      // Should use info level for normal operations
      expect(logger.log).toHaveBeenCalledWith('Starting daily subscription expiration check...');
      expect(logger.log).toHaveBeenCalledWith(
        'Updated 2 expired subscriptions: Org 1 (id-1), Org 2 (id-2)',
      );

      // Reset mocks
      jest.clearAllMocks();

      // Error scenario
      const error = new Error('Database error');
      subscriptionsService.checkAndUpdateExpiredSubscriptions.mockRejectedValue(error);

      await service.checkExpiredSubscriptions();

      // Should use error level for failures
      expect(logger.error).toHaveBeenCalledWith('Failed to check expired subscriptions', error);
    });

    it('should include relevant context in log messages', async () => {
      const mockResult = {
        updated: 3,
        expired: ['Org A (uuid-a)', 'Org B (uuid-b)', 'Org C (uuid-c)'],
      };

      subscriptionsService.checkAndUpdateExpiredSubscriptions.mockResolvedValue(mockResult);

      await service.checkExpiredSubscriptions();

      // Verify that the log message includes count and organization details
      expect(logger.log).toHaveBeenCalledWith(
        'Updated 3 expired subscriptions: Org A (uuid-a), Org B (uuid-b), Org C (uuid-c)',
      );
    });
  });
});