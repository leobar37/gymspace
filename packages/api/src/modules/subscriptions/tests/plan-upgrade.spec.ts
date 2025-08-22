import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsService } from '../subscriptions.service';
import { PrismaService } from '../../../core/database/prisma.service';
import { CacheService } from '../../../core/cache/cache.service';
import { IRequestContext, SubscriptionStatus } from '@gymspace/shared';
import {
  BusinessException,
  ValidationException,
  ResourceNotFoundException,
} from '../../../common/exceptions';

describe('SubscriptionsService - Plan Upgrade Functionality', () => {
  let service: SubscriptionsService;
  let prismaService: jest.Mocked<PrismaService>;
  let cacheService: jest.Mocked<CacheService>;

  const mockRequestContext: IRequestContext = {
    getUserId: () => 'user-1',
    getGymId: () => 'gym-1',
    getUserType: () => 'owner',
    hasPermission: () => true,
    getPermissions: () => [],
    isOwner: () => true,
  } as any;

  const mockOrganization = {
    id: 'org-1',
    ownerUserId: 'user-1',
    name: 'Test Organization',
    hasUsedFreeTrial: false,
  };

  const mockFreePlan = {
    id: 'plan-free',
    name: 'Gratuito',
    price: { USD: { value: 0, currency: 'USD' } },
    billingFrequency: 'monthly',
    duration: 30,
    durationPeriod: 'DAY' as const,
    maxGyms: 1,
    maxClientsPerGym: 50,
    maxUsersPerGym: 3,
    features: { basic: true },
    isActive: true,
  };

  const mockBasicPlan = {
    id: 'plan-basic',
    name: 'Basic',
    price: { USD: { value: 19.99, currency: 'USD' } },
    billingFrequency: 'monthly',
    duration: 1,
    durationPeriod: 'MONTH' as const,
    maxGyms: 3,
    maxClientsPerGym: 200,
    maxUsersPerGym: 5,
    features: { basic: true, analytics: true },
    isActive: true,
  };

  const mockPremiumPlan = {
    id: 'plan-premium',
    name: 'Premium',
    price: { USD: { value: 49.99, currency: 'USD' } },
    billingFrequency: 'monthly',
    duration: 1,
    durationPeriod: 'MONTH' as const,
    maxGyms: 10,
    maxClientsPerGym: 1000,
    maxUsersPerGym: 20,
    features: { basic: true, analytics: true, advanced: true },
    isActive: true,
  };

  const mockActiveSubscription = {
    id: 'sub-1',
    organizationId: 'org-1',
    subscriptionPlanId: 'plan-free',
    status: SubscriptionStatus.ACTIVE,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    isActive: true,
  };

  beforeEach(async () => {
    const mockPrismaService = {
      organization: {
        findUnique: jest.fn(),
      },
      subscriptionPlan: {
        findUnique: jest.fn(),
      },
      subscriptionOrganization: {
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const mockCacheService = {
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
    prismaService = module.get(PrismaService);
    cacheService = module.get(CacheService);

    // Mock getSubscriptionStatus to avoid circular dependency in tests
    jest.spyOn(service, 'getSubscriptionStatus').mockResolvedValue({} as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('upgradeSubscription', () => {
    it('should allow upgrade from free to basic plan', async () => {
      const organizationWithFreeSubscription = {
        ...mockOrganization,
        subscriptionOrganizations: [
          {
            ...mockActiveSubscription,
            subscriptionPlan: mockFreePlan,
          },
        ],
      };

      prismaService.organization.findUnique.mockResolvedValue(organizationWithFreeSubscription);
      prismaService.subscriptionPlan.findUnique.mockResolvedValue(mockBasicPlan);
      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback(prismaService);
      });

      await service.upgradeSubscription('org-1', 'plan-basic', mockRequestContext);

      // Verify current subscription is deactivated
      expect(prismaService.subscriptionOrganization.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: {
          isActive: false,
          updatedByUserId: 'user-1',
        },
      });

      // Verify new subscription is created
      expect(prismaService.subscriptionOrganization.create).toHaveBeenCalledWith({
        data: {
          organizationId: 'org-1',
          subscriptionPlanId: 'plan-basic',
          status: SubscriptionStatus.ACTIVE,
          startDate: expect.any(Date),
          endDate: expect.any(Date),
          createdByUserId: 'user-1',
        },
      });
    });

    it('should allow upgrade from basic to premium plan', async () => {
      const organizationWithBasicSubscription = {
        ...mockOrganization,
        subscriptionOrganizations: [
          {
            ...mockActiveSubscription,
            subscriptionPlanId: 'plan-basic',
            subscriptionPlan: mockBasicPlan,
          },
        ],
      };

      prismaService.organization.findUnique.mockResolvedValue(organizationWithBasicSubscription);
      prismaService.subscriptionPlan.findUnique.mockResolvedValue(mockPremiumPlan);
      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback(prismaService);
      });

      await service.upgradeSubscription('org-1', 'plan-premium', mockRequestContext);

      expect(prismaService.subscriptionOrganization.create).toHaveBeenCalledWith({
        data: {
          organizationId: 'org-1',
          subscriptionPlanId: 'plan-premium',
          status: SubscriptionStatus.ACTIVE,
          startDate: expect.any(Date),
          endDate: expect.any(Date),
          createdByUserId: 'user-1',
        },
      });
    });

    it('should prevent upgrade to free plan', async () => {
      const organizationWithBasicSubscription = {
        ...mockOrganization,
        subscriptionOrganizations: [
          {
            ...mockActiveSubscription,
            subscriptionPlanId: 'plan-basic',
            subscriptionPlan: mockBasicPlan,
          },
        ],
      };

      prismaService.organization.findUnique.mockResolvedValue(organizationWithBasicSubscription);
      prismaService.subscriptionPlan.findUnique.mockResolvedValue(mockFreePlan);

      await expect(
        service.upgradeSubscription('org-1', 'plan-free', mockRequestContext),
      ).rejects.toThrow(ValidationException);

      expect(prismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should prevent non-owners from upgrading subscription', async () => {
      const nonOwnerContext: IRequestContext = {
        ...mockRequestContext,
        getUserId: () => 'other-user',
        isOwner: () => false,
      };

      prismaService.organization.findUnique.mockResolvedValue({
        ...mockOrganization,
        subscriptionOrganizations: [mockActiveSubscription],
      });

      await expect(
        service.upgradeSubscription('org-1', 'plan-basic', nonOwnerContext),
      ).rejects.toThrow(BusinessException);
    });

    it('should prevent upgrade to the same plan', async () => {
      const organizationWithBasicSubscription = {
        ...mockOrganization,
        subscriptionOrganizations: [
          {
            ...mockActiveSubscription,
            subscriptionPlanId: 'plan-basic',
            subscriptionPlan: mockBasicPlan,
          },
        ],
      };

      prismaService.organization.findUnique.mockResolvedValue(organizationWithBasicSubscription);
      prismaService.subscriptionPlan.findUnique.mockResolvedValue(mockBasicPlan);

      await expect(
        service.upgradeSubscription('org-1', 'plan-basic', mockRequestContext),
      ).rejects.toThrow(BusinessException);
    });

    it('should handle organization not found', async () => {
      prismaService.organization.findUnique.mockResolvedValue(null);

      await expect(
        service.upgradeSubscription('non-existent', 'plan-basic', mockRequestContext),
      ).rejects.toThrow(ResourceNotFoundException);
    });

    it('should handle subscription plan not found', async () => {
      prismaService.organization.findUnique.mockResolvedValue({
        ...mockOrganization,
        subscriptionOrganizations: [mockActiveSubscription],
      });
      prismaService.subscriptionPlan.findUnique.mockResolvedValue(null);

      await expect(
        service.upgradeSubscription('org-1', 'non-existent-plan', mockRequestContext),
      ).rejects.toThrow(ResourceNotFoundException);
    });

    it('should calculate correct end date for monthly plan', async () => {
      const organizationWithFreeSubscription = {
        ...mockOrganization,
        subscriptionOrganizations: [mockActiveSubscription],
      };

      const monthlyPlan = {
        ...mockBasicPlan,
        duration: 1,
        durationPeriod: 'MONTH' as const,
      };

      prismaService.organization.findUnique.mockResolvedValue(organizationWithFreeSubscription);
      prismaService.subscriptionPlan.findUnique.mockResolvedValue(monthlyPlan);
      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback(prismaService);
      });

      await service.upgradeSubscription('org-1', 'plan-basic', mockRequestContext);

      const createCall = (prismaService.subscriptionOrganization.create as jest.Mock).mock
        .calls[0][0];
      const startDate = createCall.data.startDate;
      const endDate = createCall.data.endDate;

      // Should be approximately 1 month (30 days)
      const expectedDuration = 1 * 30 * 24 * 60 * 60 * 1000;
      const actualDuration = endDate.getTime() - startDate.getTime();

      expect(Math.abs(actualDuration - expectedDuration)).toBeLessThan(1000);
    });

    it('should calculate correct end date for quarterly plan', async () => {
      const organizationWithFreeSubscription = {
        ...mockOrganization,
        subscriptionOrganizations: [mockActiveSubscription],
      };

      const quarterlyPlan = {
        ...mockBasicPlan,
        duration: 3,
        durationPeriod: 'MONTH' as const,
      };

      prismaService.organization.findUnique.mockResolvedValue(organizationWithFreeSubscription);
      prismaService.subscriptionPlan.findUnique.mockResolvedValue(quarterlyPlan);
      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback(prismaService);
      });

      await service.upgradeSubscription('org-1', 'plan-basic', mockRequestContext);

      const createCall = (prismaService.subscriptionOrganization.create as jest.Mock).mock
        .calls[0][0];
      const startDate = createCall.data.startDate;
      const endDate = createCall.data.endDate;

      // Should be approximately 3 months (90 days)
      const expectedDuration = 3 * 30 * 24 * 60 * 60 * 1000;
      const actualDuration = endDate.getTime() - startDate.getTime();

      expect(Math.abs(actualDuration - expectedDuration)).toBeLessThan(1000);
    });

    it('should use default 1 month duration for plans without duration specified', async () => {
      const organizationWithFreeSubscription = {
        ...mockOrganization,
        subscriptionOrganizations: [mockActiveSubscription],
      };

      const planWithoutDuration = {
        ...mockBasicPlan,
        duration: null,
        durationPeriod: null,
      };

      prismaService.organization.findUnique.mockResolvedValue(organizationWithFreeSubscription);
      prismaService.subscriptionPlan.findUnique.mockResolvedValue(planWithoutDuration);
      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback(prismaService);
      });

      await service.upgradeSubscription('org-1', 'plan-basic', mockRequestContext);

      const createCall = (prismaService.subscriptionOrganization.create as jest.Mock).mock
        .calls[0][0];
      const startDate = createCall.data.startDate;
      const endDate = createCall.data.endDate;

      // Should default to 1 month (30 days)
      const expectedDuration = 30 * 24 * 60 * 60 * 1000;
      const actualDuration = endDate.getTime() - startDate.getTime();

      expect(Math.abs(actualDuration - expectedDuration)).toBeLessThan(1000);
    });

    it('should clear cache after successful upgrade', async () => {
      const organizationWithFreeSubscription = {
        ...mockOrganization,
        subscriptionOrganizations: [mockActiveSubscription],
      };

      prismaService.organization.findUnique.mockResolvedValue(organizationWithFreeSubscription);
      prismaService.subscriptionPlan.findUnique.mockResolvedValue(mockBasicPlan);
      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback(prismaService);
      });

      await service.upgradeSubscription('org-1', 'plan-basic', mockRequestContext);

      expect(cacheService.del).toHaveBeenCalledWith('org:org-1:*');
    });

    it('should handle upgrade when organization has no current subscription', async () => {
      const organizationWithoutSubscription = {
        ...mockOrganization,
        subscriptionOrganizations: [],
      };

      prismaService.organization.findUnique.mockResolvedValue(organizationWithoutSubscription);
      prismaService.subscriptionPlan.findUnique.mockResolvedValue(mockBasicPlan);
      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback(prismaService);
      });

      await service.upgradeSubscription('org-1', 'plan-basic', mockRequestContext);

      // Should not try to deactivate any subscription
      expect(prismaService.subscriptionOrganization.update).not.toHaveBeenCalled();

      // Should still create new subscription
      expect(prismaService.subscriptionOrganization.create).toHaveBeenCalledWith({
        data: {
          organizationId: 'org-1',
          subscriptionPlanId: 'plan-basic',
          status: SubscriptionStatus.ACTIVE,
          startDate: expect.any(Date),
          endDate: expect.any(Date),
          createdByUserId: 'user-1',
        },
      });
    });

    it('should handle database transaction failure during upgrade', async () => {
      const organizationWithFreeSubscription = {
        ...mockOrganization,
        subscriptionOrganizations: [mockActiveSubscription],
      };

      prismaService.organization.findUnique.mockResolvedValue(organizationWithFreeSubscription);
      prismaService.subscriptionPlan.findUnique.mockResolvedValue(mockBasicPlan);
      prismaService.$transaction.mockRejectedValue(new Error('Database transaction failed'));

      await expect(
        service.upgradeSubscription('org-1', 'plan-basic', mockRequestContext),
      ).rejects.toThrow('Database transaction failed');

      // Cache should not be cleared if transaction fails
      expect(cacheService.del).not.toHaveBeenCalled();
    });
  });
});
