import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaService } from '../../core/database/prisma.service';
import { CacheService } from '../../core/cache/cache.service';
import { IRequestContext, SubscriptionStatus } from '@gymspace/shared';
import { BusinessException, ResourceNotFoundException, ValidationException } from '../../common/exceptions';

// Mock data
const mockUser = {
  id: 'user-1',
  email: 'owner@test.com',
  name: 'Test Owner',
};

const mockOrganization = {
  id: 'org-1',
  ownerUserId: 'user-1',
  name: 'Test Organization',
  organizationCode: 'TEST001',
  hasUsedFreeTrial: false,
  country: 'US',
  currency: 'USD',
  timezone: 'UTC',
  createdByUserId: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
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
  description: 'Free plan',
  isActive: true,
  createdByUserId: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const mockPaidPlan = {
  id: 'plan-paid',
  name: 'Premium',
  price: { USD: { value: 29.99, currency: 'USD' } },
  billingFrequency: 'monthly',
  duration: 1,
  durationPeriod: 'MONTH' as const,
  maxGyms: 5,
  maxClientsPerGym: 500,
  maxUsersPerGym: 10,
  features: { premium: true },
  description: 'Premium plan',
  isActive: true,
  createdByUserId: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const mockActiveSubscription = {
  id: 'sub-1',
  organizationId: 'org-1',
  subscriptionPlanId: 'plan-free',
  status: SubscriptionStatus.ACTIVE,
  startDate: new Date(),
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  isActive: true,
  metadata: null,
  createdByUserId: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const mockExpiredSubscription = {
  ...mockActiveSubscription,
  id: 'sub-expired',
  status: SubscriptionStatus.ACTIVE,
  endDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
};

const mockRequestContext: IRequestContext = {
  getUserId: () => 'user-1',
  getGymId: () => 'gym-1',
  getUserType: () => 'owner',
  hasPermission: () => true,
  getPermissions: () => [],
  isOwner: () => true,
} as any;

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let prismaService: jest.Mocked<PrismaService>;
  let cacheService: jest.Mocked<CacheService>;

  beforeEach(async () => {
    const mockPrismaService = {
      subscriptionPlan: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      organization: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      subscriptionOrganization: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAvailablePlans', () => {
    it('should return cached plans if available', async () => {
      const cachedPlans = [{ id: 'plan-1', name: 'Free', isFreePlan: true }];
      cacheService.get.mockResolvedValue(cachedPlans);

      const result = await service.getAvailablePlans();

      expect(result).toEqual(cachedPlans);
      expect(cacheService.get).toHaveBeenCalledWith('subscription-plans:free');
      expect(prismaService.subscriptionPlan.findMany).not.toHaveBeenCalled();
    });

    it('should fetch and cache plans if not cached', async () => {
      cacheService.get.mockResolvedValue(null);
      prismaService.subscriptionPlan.findMany.mockResolvedValue([mockFreePlan]);

      const result = await service.getAvailablePlans();

      expect(result).toHaveLength(1);
      expect(result[0].isFreePlan).toBe(true);
      expect(cacheService.set).toHaveBeenCalledWith(
        'subscription-plans:free',
        expect.any(Array),
        3600,
      );
    });

    it('should filter only free plans', async () => {
      cacheService.get.mockResolvedValue(null);
      prismaService.subscriptionPlan.findMany.mockResolvedValue([mockFreePlan, mockPaidPlan]);

      const result = await service.getAvailablePlans();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('plan-free');
    });
  });

  describe('getSubscriptionStatus', () => {
    it('should return subscription status for organization owner', async () => {
      const organizationWithSubscription = {
        ...mockOrganization,
        subscriptionOrganizations: [
          {
            ...mockActiveSubscription,
            subscriptionPlan: mockFreePlan,
          },
        ],
        gyms: [],
      };

      prismaService.organization.findUnique.mockResolvedValue(organizationWithSubscription);

      const result = await service.getSubscriptionStatus('org-1', mockRequestContext);

      expect(result.organizationId).toBe('org-1');
      expect(result.status).toBe(SubscriptionStatus.ACTIVE);
      expect(result.isFreePlan).toBe(true);
      expect(result.daysRemaining).toBeGreaterThan(25);
    });

    it('should throw error if organization not found', async () => {
      prismaService.organization.findUnique.mockResolvedValue(null);

      await expect(
        service.getSubscriptionStatus('non-existent', mockRequestContext),
      ).rejects.toThrow(ResourceNotFoundException);
    });

    it('should throw error if no active subscription found', async () => {
      const organizationWithoutSubscription = {
        ...mockOrganization,
        subscriptionOrganizations: [],
        gyms: [],
      };

      prismaService.organization.findUnique.mockResolvedValue(organizationWithoutSubscription);

      await expect(
        service.getSubscriptionStatus('org-1', mockRequestContext),
      ).rejects.toThrow(BusinessException);
    });

    it('should calculate correct days remaining', async () => {
      const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days from now
      const organizationWithSubscription = {
        ...mockOrganization,
        subscriptionOrganizations: [
          {
            ...mockActiveSubscription,
            endDate: futureDate,
            subscriptionPlan: mockFreePlan,
          },
        ],
        gyms: [],
      };

      prismaService.organization.findUnique.mockResolvedValue(organizationWithSubscription);

      const result = await service.getSubscriptionStatus('org-1', mockRequestContext);

      expect(result.daysRemaining).toBe(10);
      expect(result.isExpired).toBe(false);
    });

    it('should detect expired subscription', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
      const organizationWithExpiredSubscription = {
        ...mockOrganization,
        subscriptionOrganizations: [
          {
            ...mockActiveSubscription,
            endDate: pastDate,
            subscriptionPlan: mockFreePlan,
          },
        ],
        gyms: [],
      };

      prismaService.organization.findUnique.mockResolvedValue(organizationWithExpiredSubscription);

      const result = await service.getSubscriptionStatus('org-1', mockRequestContext);

      expect(result.daysRemaining).toBe(0);
      expect(result.isExpired).toBe(true);
    });
  });

  describe('affiliateOrganization', () => {
    it('should allow organization to affiliate with free plan', async () => {
      const organizationWithoutSubscription = {
        ...mockOrganization,
        subscriptionOrganizations: [],
      };

      prismaService.organization.findUnique.mockResolvedValue(organizationWithoutSubscription);
      prismaService.subscriptionPlan.findUnique.mockResolvedValue(mockFreePlan);
      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback(prismaService);
      });

      // Mock the getSubscriptionStatus call
      jest.spyOn(service, 'getSubscriptionStatus').mockResolvedValue({
        organizationId: 'org-1',
        subscriptionPlan: mockFreePlan,
        status: SubscriptionStatus.ACTIVE,
        subscriptionStart: new Date(),
        subscriptionEnd: new Date(),
        daysRemaining: 30,
        isExpired: false,
        isFreePlan: true,
        usage: { gyms: 0, totalClients: 0, totalUsers: 1 },
        limits: { maxGyms: 1, maxClientsPerGym: 50, maxUsersPerGym: 3 },
      } as any);

      const result = await service.affiliateOrganization('org-1', { subscriptionPlanId: 'plan-free' }, mockRequestContext);

      expect(result.status).toBe(SubscriptionStatus.ACTIVE);
      expect(prismaService.subscriptionOrganization.create).toHaveBeenCalled();
      expect(prismaService.organization.update).toHaveBeenCalledWith({
        where: { id: 'org-1' },
        data: {
          hasUsedFreeTrial: true,
          updatedByUserId: 'user-1',
        },
      });
    });

    it('should prevent organization from using free trial twice', async () => {
      const organizationWithUsedTrial = {
        ...mockOrganization,
        hasUsedFreeTrial: true,
        subscriptionOrganizations: [],
      };

      prismaService.organization.findUnique.mockResolvedValue(organizationWithUsedTrial);
      prismaService.subscriptionPlan.findUnique.mockResolvedValue(mockFreePlan);

      await expect(
        service.affiliateOrganization('org-1', { subscriptionPlanId: 'plan-free' }, mockRequestContext),
      ).rejects.toThrow(BusinessException);
    });

    it('should reject paid plans for affiliate method', async () => {
      const organizationWithoutSubscription = {
        ...mockOrganization,
        subscriptionOrganizations: [],
      };

      prismaService.organization.findUnique.mockResolvedValue(organizationWithoutSubscription);
      prismaService.subscriptionPlan.findUnique.mockResolvedValue(mockPaidPlan);

      await expect(
        service.affiliateOrganization('org-1', { subscriptionPlanId: 'plan-paid' }, mockRequestContext),
      ).rejects.toThrow(ValidationException);
    });

    it('should prevent non-owners from affiliating organization', async () => {
      const nonOwnerContext: IRequestContext = {
        ...mockRequestContext,
        getUserId: () => 'other-user',
        isOwner: () => false,
      };

      prismaService.organization.findUnique.mockResolvedValue({
        ...mockOrganization,
        subscriptionOrganizations: [],
      });

      await expect(
        service.affiliateOrganization('org-1', { subscriptionPlanId: 'plan-free' }, nonOwnerContext),
      ).rejects.toThrow(BusinessException);
    });

    it('should deactivate current subscription when switching plans', async () => {
      const organizationWithCurrentSubscription = {
        ...mockOrganization,
        subscriptionOrganizations: [mockActiveSubscription],
      };

      prismaService.organization.findUnique.mockResolvedValue(organizationWithCurrentSubscription);
      prismaService.subscriptionPlan.findUnique.mockResolvedValue({
        ...mockFreePlan,
        id: 'plan-free-2',
        name: 'Another Free Plan',
      });
      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback(prismaService);
      });

      jest.spyOn(service, 'getSubscriptionStatus').mockResolvedValue({} as any);

      await service.affiliateOrganization('org-1', { subscriptionPlanId: 'plan-free-2' }, mockRequestContext);

      expect(prismaService.subscriptionOrganization.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: {
          isActive: false,
          updatedByUserId: 'user-1',
        },
      });
    });
  });

  describe('upgradeSubscription', () => {
    it('should allow upgrade to paid plan', async () => {
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
      prismaService.subscriptionPlan.findUnique.mockResolvedValue(mockPaidPlan);
      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback(prismaService);
      });

      jest.spyOn(service, 'getSubscriptionStatus').mockResolvedValue({} as any);

      await service.upgradeSubscription('org-1', 'plan-paid', mockRequestContext);

      expect(prismaService.subscriptionOrganization.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: {
          isActive: false,
          updatedByUserId: 'user-1',
        },
      });

      expect(prismaService.subscriptionOrganization.create).toHaveBeenCalledWith({
        data: {
          organizationId: 'org-1',
          subscriptionPlanId: 'plan-paid',
          status: SubscriptionStatus.ACTIVE,
          startDate: expect.any(Date),
          endDate: expect.any(Date),
          createdByUserId: 'user-1',
        },
      });
    });

    it('should reject upgrade to free plan', async () => {
      const organizationWithPaidSubscription = {
        ...mockOrganization,
        subscriptionOrganizations: [
          {
            ...mockActiveSubscription,
            subscriptionPlan: mockPaidPlan,
          },
        ],
      };

      prismaService.organization.findUnique.mockResolvedValue(organizationWithPaidSubscription);
      prismaService.subscriptionPlan.findUnique.mockResolvedValue(mockFreePlan);

      await expect(
        service.upgradeSubscription('org-1', 'plan-free', mockRequestContext),
      ).rejects.toThrow(ValidationException);
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
        service.upgradeSubscription('org-1', 'plan-paid', nonOwnerContext),
      ).rejects.toThrow(BusinessException);
    });

    it('should calculate correct end date based on plan duration', async () => {
      const organizationWithFreeSubscription = {
        ...mockOrganization,
        subscriptionOrganizations: [mockActiveSubscription],
      };

      const planWithCustomDuration = {
        ...mockPaidPlan,
        duration: 3,
        durationPeriod: 'MONTH' as const,
      };

      prismaService.organization.findUnique.mockResolvedValue(organizationWithFreeSubscription);
      prismaService.subscriptionPlan.findUnique.mockResolvedValue(planWithCustomDuration);
      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback(prismaService);
      });

      jest.spyOn(service, 'getSubscriptionStatus').mockResolvedValue({} as any);

      await service.upgradeSubscription('org-1', 'plan-paid', mockRequestContext);

      const createCall = (prismaService.subscriptionOrganization.create as jest.Mock).mock.calls[0][0];
      const startDate = createCall.data.startDate;
      const endDate = createCall.data.endDate;

      // Should be approximately 3 months (90 days)
      const expectedDuration = 3 * 30 * 24 * 60 * 60 * 1000;
      const actualDuration = endDate.getTime() - startDate.getTime();
      
      expect(Math.abs(actualDuration - expectedDuration)).toBeLessThan(1000); // Within 1 second
    });
  });

  describe('checkAndUpdateExpiredSubscriptions', () => {
    it('should find and update expired subscriptions', async () => {
      const expiredSubscriptions = [
        {
          ...mockExpiredSubscription,
          organization: { id: 'org-1', name: 'Test Org 1' },
        },
        {
          ...mockExpiredSubscription,
          id: 'sub-expired-2',
          organizationId: 'org-2',
          organization: { id: 'org-2', name: 'Test Org 2' },
        },
      ];

      prismaService.subscriptionOrganization.findMany.mockResolvedValue(expiredSubscriptions);

      const result = await service.checkAndUpdateExpiredSubscriptions();

      expect(result.updated).toBe(2);
      expect(result.expired).toHaveLength(2);
      expect(result.expired[0]).toBe('Test Org 1 (org-1)');

      expect(prismaService.subscriptionOrganization.updateMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: ['sub-expired', 'sub-expired-2'],
          },
        },
        data: {
          status: SubscriptionStatus.EXPIRED,
          updatedAt: expect.any(Date),
        },
      });

      expect(cacheService.del).toHaveBeenCalledTimes(2);
    });

    it('should return zero updates when no expired subscriptions found', async () => {
      prismaService.subscriptionOrganization.findMany.mockResolvedValue([]);

      const result = await service.checkAndUpdateExpiredSubscriptions();

      expect(result.updated).toBe(0);
      expect(result.expired).toHaveLength(0);
      expect(prismaService.subscriptionOrganization.updateMany).not.toHaveBeenCalled();
    });

    it('should only find subscriptions that are currently active and past end date', async () => {
      await service.checkAndUpdateExpiredSubscriptions();

      expect(prismaService.subscriptionOrganization.findMany).toHaveBeenCalledWith({
        where: {
          endDate: {
            lt: expect.any(Date),
          },
          status: SubscriptionStatus.ACTIVE,
          isActive: true,
          deletedAt: null,
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    });
  });

  describe('checkSubscriptionLimit', () => {
    it('should check gym limit correctly', async () => {
      const organizationWithGyms = {
        ...mockOrganization,
        subscriptionOrganizations: [
          {
            ...mockActiveSubscription,
            subscriptionPlan: mockFreePlan,
          },
        ],
        gyms: [{ id: 'gym-1' }], // 1 gym, limit is 1
      };

      prismaService.organization.findUnique.mockResolvedValue(organizationWithGyms);

      const result = await service.checkSubscriptionLimit('org-1', 'gyms');

      expect(result.canPerform).toBe(false); // Already at limit
      expect(result.currentUsage).toBe(1);
      expect(result.limit).toBe(1);
      expect(result.message).toContain('gyms limit');
    });

    it('should check client limit per gym correctly', async () => {
      const organizationWithClients = {
        ...mockOrganization,
        subscriptionOrganizations: [
          {
            ...mockActiveSubscription,
            subscriptionPlan: mockFreePlan,
          },
        ],
        gyms: [
          {
            id: 'gym-1',
            gymClients: new Array(25), // 25 clients, limit is 50
          },
        ],
      };

      prismaService.organization.findUnique.mockResolvedValue(organizationWithClients);

      const result = await service.checkSubscriptionLimit('org-1', 'clients', 'gym-1');

      expect(result.canPerform).toBe(true);
      expect(result.currentUsage).toBe(25);
      expect(result.limit).toBe(50);
      expect(result.message).toBeUndefined();
    });

    it('should check user limit per gym correctly', async () => {
      const organizationWithUsers = {
        ...mockOrganization,
        subscriptionOrganizations: [
          {
            ...mockActiveSubscription,
            subscriptionPlan: mockFreePlan,
          },
        ],
        gyms: [
          {
            id: 'gym-1',
            collaborators: [{ userId: 'user-2' }, { userId: 'user-3' }], // 2 collaborators + 1 owner = 3, limit is 3
          },
        ],
      };

      prismaService.organization.findUnique.mockResolvedValue(organizationWithUsers);

      const result = await service.checkSubscriptionLimit('org-1', 'users', 'gym-1');

      expect(result.canPerform).toBe(false); // At limit
      expect(result.currentUsage).toBe(3); // 2 collaborators + 1 owner
      expect(result.limit).toBe(3);
    });

    it('should require gymId for client and user limit checks', async () => {
      const organizationWithSubscription = {
        ...mockOrganization,
        subscriptionOrganizations: [mockActiveSubscription],
        gyms: [],
      };

      prismaService.organization.findUnique.mockResolvedValue(organizationWithSubscription);

      await expect(
        service.checkSubscriptionLimit('org-1', 'clients'),
      ).rejects.toThrow(ValidationException);

      await expect(
        service.checkSubscriptionLimit('org-1', 'users'),
      ).rejects.toThrow(ValidationException);
    });

    it('should throw error if gym not found for client/user limit check', async () => {
      const organizationWithoutTargetGym = {
        ...mockOrganization,
        subscriptionOrganizations: [mockActiveSubscription],
        gyms: [{ id: 'other-gym' }],
      };

      prismaService.organization.findUnique.mockResolvedValue(organizationWithoutTargetGym);

      await expect(
        service.checkSubscriptionLimit('org-1', 'clients', 'non-existent-gym'),
      ).rejects.toThrow(ResourceNotFoundException);
    });
  });

  describe('getDefaultFreePlan', () => {
    it('should return default free plan', async () => {
      prismaService.subscriptionPlan.findFirst.mockResolvedValue({
        id: 'plan-free',
        name: 'Gratuito',
      });

      const result = await service.getDefaultFreePlan();

      expect(result.id).toBe('plan-free');
      expect(result.name).toBe('Gratuito');
      expect(prismaService.subscriptionPlan.findFirst).toHaveBeenCalledWith({
        where: {
          name: 'Gratuito',
          deletedAt: null,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
        },
      });
    });

    it('should throw error if default free plan not found', async () => {
      prismaService.subscriptionPlan.findFirst.mockResolvedValue(null);

      await expect(service.getDefaultFreePlan()).rejects.toThrow(BusinessException);
    });
  });
});