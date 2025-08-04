import { IRequestContext, SubscriptionStatus } from '@gymspace/shared';
import { Injectable } from '@nestjs/common';
import {
  BusinessException,
  ResourceNotFoundException,
  ValidationException,
} from '../../common/exceptions';
import { CacheService } from '../../core/cache/cache.service';
import { PrismaService } from '../../core/database/prisma.service';
import {
  AffiliateOrganizationDto,
  AvailablePlanDto,
  SubscriptionStatusDto,
} from './dto';

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
        subscriptionPlan: true,
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

    // Calculate usage
    const totalClients = organization.gyms.reduce(
      (sum, gym) => sum + gym.gymClients.length,
      0,
    );
    const totalUsers = organization.gyms.reduce(
      (sum, gym) => sum + gym.collaborators.length + 1, // +1 for owner
      0,
    );

    // Calculate days remaining
    const now = new Date();
    const daysRemaining = Math.max(
      0,
      Math.ceil(
        (organization.subscriptionEnd.getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    );

    const isExpired = now > organization.subscriptionEnd;
    const isFreePlan = this.isFreePlan(organization.subscriptionPlan.price);

    return {
      organizationId: organization.id,
      subscriptionPlan: {
        id: organization.subscriptionPlan.id,
        name: organization.subscriptionPlan.name,
        price: organization.subscriptionPlan.price,
        billingFrequency: organization.subscriptionPlan.billingFrequency,
        maxGyms: organization.subscriptionPlan.maxGyms,
        maxClientsPerGym: organization.subscriptionPlan.maxClientsPerGym,
        maxUsersPerGym: organization.subscriptionPlan.maxUsersPerGym,
        features: organization.subscriptionPlan.features as any,
      },
      status: organization.subscriptionStatus as SubscriptionStatus,
      subscriptionStart: organization.subscriptionStart,
      subscriptionEnd: organization.subscriptionEnd,
      daysRemaining,
      isExpired,
      isFreePlan,
      usage: {
        gyms: organization.gyms.length,
        totalClients,
        totalUsers,
      },
      limits: {
        maxGyms: organization.subscriptionPlan.maxGyms,
        maxClientsPerGym: organization.subscriptionPlan.maxClientsPerGym,
        maxUsersPerGym: organization.subscriptionPlan.maxUsersPerGym,
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
        subscriptionPlan: true,
      },
    });

    if (!organization) {
      throw new ResourceNotFoundException('Organization not found');
    }

    if (organization.ownerUserId !== context.getUserId()) {
      throw new BusinessException(
        'Only the organization owner can change subscription plans',
      );
    }

    // Get the new plan
    const newPlan = await this.prisma.subscriptionPlan.findUnique({
      where: {
        id: dto.subscriptionPlanId,
        deletedAt: null,
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

    // Check if already on this plan
    if (organization.subscriptionPlanId === newPlan.id) {
      throw new BusinessException('Organization is already on this plan');
    }

    // Update the organization's subscription
    await this.prisma.organization.update({
      where: {
        id: organizationId,
      },
      data: {
        subscriptionPlanId: newPlan.id,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionStart: new Date(),
        subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial for free plans
        updatedByUserId: context.getUserId(),
      },
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
        subscriptionPlan: true,
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

    const plan = organization.subscriptionPlan;
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
  async getDefaultFreePlan(): Promise<{ id: string; name: string }> {
    const freePlan = await this.prisma.subscriptionPlan.findFirst({
      where: {
        name: 'Gratuito',
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!freePlan) {
      throw new BusinessException(
        'Default free plan not found. Please run database seed.',
      );
    }

    return freePlan;
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