import { IRequestContext, SubscriptionStatus } from '@gymspace/shared';
import { Injectable } from '@nestjs/common';
import {
  BusinessException,
  ResourceNotFoundException,
  ValidationException,
} from '../../common/exceptions';
import { CacheService } from '../../core/cache/cache.service';
import { PrismaService } from '../../core/database/prisma.service';
import { AffiliateOrganizationDto, AvailablePlanDto, SubscriptionStatusDto } from './dto';
import dayjs from 'dayjs';

export enum DurationPeriod {
  DAY = 'DAY',
  MONTH = 'MONTH',
  YEAR = 'YEAR',
}

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  /**
   * Get all available subscription plans
   * For now, only returns free plans
   */
  async getAvailablePlans(): Promise<AvailablePlanDto[]> {
    const cacheKey = 'subscription-plans:free';
    const cached = await this.cache.get<AvailablePlanDto[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const plans = await this.prisma.subscriptionPlan.findMany({
      where: {
        deletedAt: null,
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Transform and filter to only free plans
    const availablePlans = plans
      .map((plan) => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        billingFrequency: plan.billingFrequency,
        maxGyms: plan.maxGyms,
        maxClientsPerGym: plan.maxClientsPerGym,
        maxUsersPerGym: plan.maxUsersPerGym,
        features: plan.features,
        isFreePlan: this.isFreePlan(plan.price),
      }))
      .filter((plan) => plan.isFreePlan); // Only return free plans for now

    // Cache for 1 hour
    await this.cache.set(cacheKey, availablePlans, 3600);

    return availablePlans;
  }

  /**
   * Get current subscription status for an organization
   */
  async getSubscriptionStatus(
    organizationId: string,
    context: IRequestContext,
  ): Promise<SubscriptionStatusDto> {
    const organization = await this.prisma.organization.findUnique({
      where: {
        id: organizationId,
        deletedAt: null,
      },
      include: {
        subscriptionOrganizations: {
          where: {
            isActive: true,
            deletedAt: null,
          },
          include: {
            subscriptionPlan: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
        gyms: {
          where: {
            deletedAt: null,
          },
          include: {
            gymClients: {
              where: {
                deletedAt: null,
              },
            },
            collaborators: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    if (!organization) {
      throw new ResourceNotFoundException('Organization not found');
    }

    // Verify user has access to this organization
    if (organization.ownerUserId !== context.getUserId()) {
      // Check if user is a collaborator in any gym
      const hasAccess = organization.gyms.some((gym) =>
        gym.collaborators.some((collab) => collab.userId === context.getUserId()),
      );

      if (!hasAccess) {
        throw new BusinessException('You do not have access to this organization');
      }
    }

    // Get active subscription
    const activeSubscription = organization.subscriptionOrganizations[0];
    if (!activeSubscription) {
      throw new BusinessException('No active subscription found for this organization');
    }

    // Calculate usage
    const totalClients = organization.gyms.reduce((sum, gym) => sum + gym.gymClients.length, 0);
    const totalUsers = organization.gyms.reduce(
      (sum, gym) => sum + gym.collaborators.length + 1, // +1 for owner
      0,
    );

    // Calculate days remaining
    const now = new Date();
    const daysRemaining = Math.max(
      0,
      Math.ceil((activeSubscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    );

    const isExpired = now > activeSubscription.endDate;
    const isFreePlan = this.isFreePlan(activeSubscription.subscriptionPlan.price);

    return {
      organizationId: organization.id,
      subscriptionPlan: {
        id: activeSubscription.subscriptionPlan.id,
        name: activeSubscription.subscriptionPlan.name,
        price: activeSubscription.subscriptionPlan.price,
        billingFrequency: activeSubscription.subscriptionPlan.billingFrequency,
        maxGyms: activeSubscription.subscriptionPlan.maxGyms,
        maxClientsPerGym: activeSubscription.subscriptionPlan.maxClientsPerGym,
        maxUsersPerGym: activeSubscription.subscriptionPlan.maxUsersPerGym,
        features: activeSubscription.subscriptionPlan.features as any,
      },
      status: activeSubscription.status as SubscriptionStatus,
      subscriptionStart: activeSubscription.startDate,
      subscriptionEnd: activeSubscription.endDate,
      daysRemaining,
      isExpired,
      isFreePlan,
      usage: {
        gyms: organization.gyms.length,
        totalClients,
        totalUsers,
      },
      limits: {
        maxGyms: activeSubscription.subscriptionPlan.maxGyms,
        maxClientsPerGym: activeSubscription.subscriptionPlan.maxClientsPerGym,
        maxUsersPerGym: activeSubscription.subscriptionPlan.maxUsersPerGym,
      },
    };
  }

  /**
   * Affiliate an organization to a subscription plan
   * Currently only allows free plans
   */
  async affiliateOrganization(
    organizationId: string,
    dto: AffiliateOrganizationDto,
    context: IRequestContext,
  ): Promise<SubscriptionStatusDto> {
    // Verify organization exists and user is owner
    const organization = await this.prisma.organization.findUnique({
      where: {
        id: organizationId,
        deletedAt: null,
      },
      include: {
        subscriptionOrganizations: {
          where: {
            isActive: true,
            deletedAt: null,
          },
          include: {
            subscriptionPlan: true,
          },
        },
      },
    });

    if (!organization) {
      throw new ResourceNotFoundException('Organization not found');
    }

    if (organization.ownerUserId !== context.getUserId()) {
      throw new BusinessException('Only the organization owner can change subscription plans');
    }

    // Get the new plan
    const newPlan = await this.prisma.subscriptionPlan.findUnique({
      where: {
        id: dto.subscriptionPlanId,
        deletedAt: null,
        isActive: true,
      },
    });

    if (!newPlan) {
      throw new ResourceNotFoundException('Subscription plan not found');
    }

    // Verify it's a free plan
    if (!this.isFreePlan(newPlan.price)) {
      throw new ValidationException([
        {
          field: 'subscriptionPlanId',
          message: 'Only free plans are allowed at this time',
        },
      ]);
    }

    // Check if it's a free plan and organization has already used free trial
    if (this.isFreePlan(newPlan.price) && organization.hasUsedFreeTrial) {
      throw new BusinessException('Organization has already used their free trial period');
    }

    // Check if already on this plan
    const currentSubscription = organization.subscriptionOrganizations[0];
    if (currentSubscription && currentSubscription.subscriptionPlanId === newPlan.id) {
      throw new BusinessException('Organization is already on this plan');
    }

    await this.prisma.$transaction(async (prisma) => {
      // Deactivate current subscription if exists
      if (currentSubscription) {
        await prisma.subscriptionOrganization.update({
          where: {
            id: currentSubscription.id,
          },
          data: {
            isActive: false,
            updatedByUserId: context.getUserId(),
          },
        });
      }

      // Create new subscription
      await prisma.subscriptionOrganization.create({
        data: {
          organizationId,
          subscriptionPlanId: newPlan.id,
          status: SubscriptionStatus.ACTIVE,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial for free plans
          createdByUserId: context.getUserId(),
        },
      });

      // Mark organization as having used free trial if it's a free plan
      if (this.isFreePlan(newPlan.price)) {
        await prisma.organization.update({
          where: {
            id: organizationId,
          },
          data: {
            hasUsedFreeTrial: true,
            updatedByUserId: context.getUserId(),
          },
        });
      }
    });

    // Clear cache
    await this.cache.del(`org:${organizationId}:*`);

    // Return updated status
    return this.getSubscriptionStatus(organizationId, context);
  }

  /**
   * Check if an organization can perform an action based on subscription limits
   */
  async checkSubscriptionLimit(
    organizationId: string,
    limitType: 'gyms' | 'clients' | 'users',
    gymId?: string,
  ): Promise<{
    canPerform: boolean;
    currentUsage: number;
    limit: number;
    message?: string;
  }> {
    const organization = await this.prisma.organization.findUnique({
      where: {
        id: organizationId,
        deletedAt: null,
      },
      include: {
        subscriptionOrganizations: {
          where: {
            isActive: true,
            deletedAt: null,
          },
          include: {
            subscriptionPlan: true,
          },
          take: 1,
        },
        gyms: {
          where: {
            deletedAt: null,
          },
          include: {
            gymClients: {
              where: {
                deletedAt: null,
              },
            },
            collaborators: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    if (!organization) {
      throw new ResourceNotFoundException('Organization not found');
    }

    const activeSubscription = organization.subscriptionOrganizations[0];
    if (!activeSubscription) {
      throw new BusinessException('No active subscription found for this organization');
    }

    const plan = activeSubscription.subscriptionPlan;
    let currentUsage = 0;
    let limit = 0;

    switch (limitType) {
      case 'gyms':
        currentUsage = organization.gyms.length;
        limit = plan.maxGyms;
        break;

      case 'clients':
        if (!gymId) {
          throw new ValidationException([
            { field: 'gymId', message: 'Gym ID is required for client limit check' },
          ]);
        }
        const gym = organization.gyms.find((g) => g.id === gymId);
        if (!gym) {
          throw new ResourceNotFoundException('Gym not found');
        }
        currentUsage = gym.gymClients.length;
        limit = plan.maxClientsPerGym;
        break;

      case 'users':
        if (!gymId) {
          throw new ValidationException([
            { field: 'gymId', message: 'Gym ID is required for user limit check' },
          ]);
        }
        const targetGym = organization.gyms.find((g) => g.id === gymId);
        if (!targetGym) {
          throw new ResourceNotFoundException('Gym not found');
        }
        currentUsage = targetGym.collaborators.length + 1; // +1 for owner
        limit = plan.maxUsersPerGym;
        break;
    }

    const canPerform = currentUsage < limit;
    const message = canPerform
      ? undefined
      : `You have reached the ${limitType} limit for your subscription plan`;

    return {
      canPerform,
      currentUsage,
      limit,
      message,
    };
  }

  /**
   * Get the default free plan (Gratuito)
   */
  async getDefaultFreePlan(): Promise<{
    id: string;
    name: string;
    duration: number;
    durationPeriod: string;
  }> {
    const freePlan = await this.prisma.subscriptionPlan.findFirst({
      where: {
        name: 'Gratuito',
        deletedAt: null,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        duration: true,
        durationPeriod: true,
      },
    });

    if (!freePlan) {
      throw new BusinessException('Default free plan not found. Please run database seed.');
    }

    return freePlan;
  }

  /**
   * Create a free trial subscription for a new organization
   * This is called when a new owner registers
   */
  async createFreeTrialSubscription(organizationId: string, userId: string): Promise<void> {
    const freePlan = await this.getDefaultFreePlan();

    // Calculate end date based on plan duration
    const startDate = new Date();
    let endDate: Date;

    if (freePlan.duration && freePlan.durationPeriod) {
      if (freePlan.durationPeriod === DurationPeriod.MONTH) {
        endDate = dayjs(startDate).add(freePlan.duration, 'month').toDate();
      } else if (freePlan.durationPeriod === DurationPeriod.YEAR) {
        endDate = dayjs(startDate).add(freePlan.duration, 'year').toDate();
      } else if (freePlan.durationPeriod === DurationPeriod.DAY) {
        endDate = dayjs(startDate).add(freePlan.duration, 'day').toDate();
      } else {
        // Default to 30 days if unknown period
        endDate = dayjs(startDate).add(30, 'day').toDate();
      }
    } else {
      // Default to 30 days if no duration specified
      endDate = dayjs(startDate).add(30, 'day').toDate();
    }

    await this.prisma.subscriptionOrganization.create({
      data: {
        organizationId,
        subscriptionPlanId: freePlan.id,
        status: SubscriptionStatus.ACTIVE,
        startDate,
        endDate,
        isActive: true,
        createdByUserId: userId,
      },
    });

    // Mark organization as having used free trial
    await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        hasUsedFreeTrial: true,
        updatedByUserId: userId,
      },
    });
  }

  /**
   * Check subscription expiration and update status
   * This method will be called by the cron job
   */
  async checkAndUpdateExpiredSubscriptions(): Promise<{
    updated: number;
    expired: string[];
  }> {
    const now = new Date();

    const expiredSubscriptions = await this.prisma.subscriptionOrganization.findMany({
      where: {
        endDate: {
          lt: now,
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

    if (expiredSubscriptions.length === 0) {
      return { updated: 0, expired: [] };
    }

    // Update expired subscriptions
    await this.prisma.subscriptionOrganization.updateMany({
      where: {
        id: {
          in: expiredSubscriptions.map((sub) => sub.id),
        },
      },
      data: {
        status: SubscriptionStatus.EXPIRED,
        updatedAt: now,
      },
    });

    // Clear caches for affected organizations
    for (const subscription of expiredSubscriptions) {
      await this.cache.del(`org:${subscription.organizationId}:*`);
    }

    return {
      updated: expiredSubscriptions.length,
      expired: expiredSubscriptions.map(
        (sub) => `${sub.organization.name} (${sub.organizationId})`,
      ),
    };
  }

  /**
   * Upgrade organization subscription to a paid plan
   */
  async upgradeSubscription(
    organizationId: string,
    subscriptionPlanId: string,
    context: IRequestContext,
  ): Promise<SubscriptionStatusDto> {
    // Verify organization exists and user is owner
    const organization = await this.prisma.organization.findUnique({
      where: {
        id: organizationId,
        deletedAt: null,
      },
      include: {
        subscriptionOrganizations: {
          where: {
            isActive: true,
            deletedAt: null,
          },
          include: {
            subscriptionPlan: true,
          },
        },
      },
    });

    if (!organization) {
      throw new ResourceNotFoundException('Organization not found');
    }

    if (organization.ownerUserId !== context.getUserId()) {
      throw new BusinessException('Only the organization owner can upgrade subscription plans');
    }

    // Get the new plan
    const newPlan = await this.prisma.subscriptionPlan.findUnique({
      where: {
        id: subscriptionPlanId,
        deletedAt: null,
        isActive: true,
      },
    });

    if (!newPlan) {
      throw new ResourceNotFoundException('Subscription plan not found');
    }

    // Verify it's not a free plan
    if (this.isFreePlan(newPlan.price)) {
      throw new ValidationException([
        {
          field: 'subscriptionPlanId',
          message: 'Cannot upgrade to a free plan. Use affiliate method instead.',
        },
      ]);
    }

    const currentSubscription = organization.subscriptionOrganizations[0];
    if (currentSubscription && currentSubscription.subscriptionPlanId === newPlan.id) {
      throw new BusinessException('Organization is already on this plan');
    }

    await this.prisma.$transaction(async (prisma) => {
      // Deactivate current subscription if exists
      if (currentSubscription) {
        await prisma.subscriptionOrganization.update({
          where: {
            id: currentSubscription.id,
          },
          data: {
            isActive: false,
            updatedByUserId: context.getUserId(),
          },
        });
      }

      // Create new subscription with duration based on plan
      const startDate = new Date();
      let endDate: Date;

      if (newPlan.duration && newPlan.durationPeriod) {
        const multiplier = newPlan.durationPeriod === 'MONTH' ? 30 : 1;
        endDate = new Date(
          startDate.getTime() + newPlan.duration * multiplier * 24 * 60 * 60 * 1000,
        );
      } else {
        // Default to 1 month for paid plans
        endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      }

      await prisma.subscriptionOrganization.create({
        data: {
          organizationId,
          subscriptionPlanId: newPlan.id,
          status: SubscriptionStatus.ACTIVE,
          startDate,
          endDate,
          createdByUserId: context.getUserId(),
        },
      });
    });

    // Clear cache
    await this.cache.del(`org:${organizationId}:*`);

    // Return updated status
    return this.getSubscriptionStatus(organizationId, context);
  }

  /**
   * Helper method to check if a plan is free
   */
  private isFreePlan(price: any): boolean {
    if (!price || typeof price !== 'object') {
      return false;
    }

    // Check if all currency values are 0
    return Object.values(price).every((currencyInfo: any) => {
      return currencyInfo.value === 0;
    });
  }
}
