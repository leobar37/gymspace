import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { CacheService } from '../../core/cache/cache.service';
import { UpdateOrganizationDto, ListOrganizationsResponseDto } from './dto';
import { ResourceNotFoundException } from '../../common/exceptions';
import { RequestContext } from '../../common/services/request-context.service';
import { Organization } from '@prisma/client';
import { IRequestContext } from '@gymspace/shared';
import { SubscriptionDateManagerService } from '../subscriptions/services/subscription-date-manager.service';

@Injectable()
export class OrganizationsService {
  constructor(
    private prismaService: PrismaService,
    private cacheService: CacheService,
    private dateManager: SubscriptionDateManagerService,
  ) {}

  /**
   * Get organization by ID
   */
  async getOrganization(
    context: RequestContext,
    organizationId: string,
  ): Promise<Organization & { subscriptionPlan: any }> {
    const userId = context.getUserId();
    const organization = await this.prismaService.organization.findFirst({
      where: {
        id: organizationId,
        ownerUserId: userId,
      },
      include: {
        subscriptionOrganizations: {
          where: {
            isActive: true,
          },
          include: {
            subscriptionPlan: true,
          },
          take: 1,
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            gyms: true,
          },
        },
      },
    });

    if (!organization) {
      throw new ResourceNotFoundException('Organization', organizationId);
    }

    // Extract the subscription plan from the active subscription
    const subscriptionPlan = organization.subscriptionOrganizations[0]?.subscriptionPlan || null;

    return {
      ...organization,
      subscriptionPlan,
    } as Organization & { subscriptionPlan: any };
  }

  /**
   * Update organization settings
   */
  async updateOrganization(
    context: RequestContext,
    organizationId: string,
    dto: UpdateOrganizationDto,
  ): Promise<Organization> {
    const userId = context.getUserId();
    // Verify ownership
    const organization = await this.prismaService.organization.findFirst({
      where: {
        id: organizationId,
        ownerUserId: userId,
      },
    });

    if (!organization) {
      throw new ResourceNotFoundException('Organization', organizationId);
    }

    // Update organization name only
    const updated = await this.prismaService.organization.update({
      where: { id: organizationId },
      data: {
        name: dto.name,
        updatedByUserId: userId,
      },
      include: {
        subscriptionOrganizations: {
          where: {
            isActive: true,
          },
          include: {
            subscriptionPlan: true,
          },
          take: 1,
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            gyms: true,
          },
        },
      },
    });

    // Invalidate cache
    try {
      await this.cacheService.del(`org:${organizationId}`);
    } catch (error) {
      // Log cache error but don't fail the operation
      console.warn(`Failed to invalidate cache for organization ${organizationId}:`, error);
    }

    return updated;
  }

  /**
   * Get organization statistics
   */
  async getOrganizationStats(context: RequestContext, organizationId: string) {
    // Verify ownership
    const organization = await this.getOrganization(context, organizationId);

    const [gymsCount, totalClients, totalCollaborators, activeContracts] = await Promise.all([
      this.prismaService.gym.count({
        where: { organizationId },
      }),
      this.prismaService.gymClient.count({
        where: {
          gym: { organizationId },
        },
      }),
      this.prismaService.collaborator.count({
        where: {
          gym: { organizationId },
          status: 'active',
        },
      }),
      this.prismaService.contract.count({
        where: {
          gymClient: {
            gym: { organizationId },
          },
          status: 'active',
        },
      }),
    ]);

    const org = organization as any; // Type assertion to access subscriptionPlan

    if (!org.subscriptionPlan) {
      throw new ResourceNotFoundException(
        `No active subscription found for organization with ID: ${organizationId}`,
      );
    }

    return {
      organization: {
        id: org.id,
        country: org.country,
        currency: org.currency,
        timezone: org.timezone,
      },
      subscriptionPlan: {
        name: org.subscriptionPlan.name,
        maxGyms: org.subscriptionPlan.maxGyms,
        maxClientsPerGym: org.subscriptionPlan.maxClientsPerGym,
        maxUsersPerGym: org.subscriptionPlan.maxUsersPerGym,
      },
      usage: {
        gyms: {
          current: gymsCount,
          limit: org.subscriptionPlan.maxGyms,
          percentage:
            org.subscriptionPlan.maxGyms > 0
              ? Math.round((gymsCount / org.subscriptionPlan.maxGyms) * 100 * 100) / 100
              : 0,
        },
        clients: {
          current: totalClients,
          limit: org.subscriptionPlan.maxClientsPerGym * org.subscriptionPlan.maxGyms,
          percentage:
            org.subscriptionPlan.maxClientsPerGym * org.subscriptionPlan.maxGyms > 0
              ? Math.round(
                  (totalClients /
                    (org.subscriptionPlan.maxClientsPerGym * org.subscriptionPlan.maxGyms)) *
                    100 *
                    100,
                ) / 100
              : 0,
        },
        collaborators: {
          current: totalCollaborators,
          limit: org.subscriptionPlan.maxUsersPerGym * org.subscriptionPlan.maxGyms,
          percentage:
            org.subscriptionPlan.maxUsersPerGym * org.subscriptionPlan.maxGyms > 0
              ? Math.round(
                  (totalCollaborators /
                    (org.subscriptionPlan.maxUsersPerGym * org.subscriptionPlan.maxGyms)) *
                    100 *
                    100,
                ) / 100
              : 0,
        },
      },
      metrics: {
        totalClients,
        activeContracts,
        totalCollaborators,
        gymsCount,
      },
    };
  }

  /**
   * Get organization usage statistics for validation
   */
  async getOrganizationUsageStats(organizationId: string) {
    const [gymsCount, totalClients, totalCollaborators] = await Promise.all([
      this.prismaService.gym.count({
        where: { organizationId, deletedAt: null },
      }),
      this.prismaService.gymClient.count({
        where: {
          gym: { organizationId, deletedAt: null },
          deletedAt: null,
        },
      }),
      this.prismaService.collaborator.count({
        where: {
          gym: { organizationId, deletedAt: null },
          status: 'active',
          deletedAt: null,
        },
      }),
    ]);

    return {
      gymsCount,
      totalClients,
      totalCollaborators,
    };
  }

  /**
   * Check if organization can add more gyms
   */
  async canAddGym(_context: RequestContext, organizationId: string): Promise<boolean> {
    const organization = await this.prismaService.organization.findUnique({
      where: { id: organizationId },
      include: {
        subscriptionOrganizations: {
          where: {
            isActive: true,
          },
          include: {
            subscriptionPlan: true,
          },
          take: 1,
        },
        _count: {
          select: { gyms: true },
        },
      },
    });

    if (!organization) {
      throw new ResourceNotFoundException('Organization', organizationId);
    }

    const subscriptionPlan = organization.subscriptionOrganizations[0]?.subscriptionPlan;
    if (!subscriptionPlan) {
      return false; // No active subscription
    }

    return organization._count.gyms < subscriptionPlan.maxGyms;
  }

  /**
   * Check if gym can add more clients
   */
  async canAddClient(_context: RequestContext, gymId: string): Promise<boolean> {
    const gym = await this.prismaService.gym.findUnique({
      where: { id: gymId },
      include: {
        organization: {
          include: {
            subscriptionOrganizations: {
              where: {
                isActive: true,
              },
              include: {
                subscriptionPlan: true,
              },
              take: 1,
            },
          },
        },
        _count: {
          select: { gymClients: true },
        },
      },
    });

    if (!gym) {
      throw new ResourceNotFoundException('Gym', gymId);
    }

    const subscriptionPlan = gym.organization.subscriptionOrganizations[0]?.subscriptionPlan;
    if (!subscriptionPlan) {
      return false; // No active subscription
    }

    return gym._count.gymClients < subscriptionPlan.maxClientsPerGym;
  }

  /**
   * Check if gym can add more collaborators
   */
  async canAddCollaborator(_context: RequestContext, gymId: string): Promise<boolean> {
    const gym = await this.prismaService.gym.findUnique({
      where: { id: gymId },
      include: {
        organization: {
          include: {
            subscriptionOrganizations: {
              where: {
                isActive: true,
              },
              include: {
                subscriptionPlan: true,
              },
              take: 1,
            },
          },
        },
        _count: {
          select: {
            collaborators: {
              where: { status: 'active' },
            },
          },
        },
      },
    });

    if (!gym) {
      throw new ResourceNotFoundException('Gym', gymId);
    }

    const subscriptionPlan = gym.organization.subscriptionOrganizations[0]?.subscriptionPlan;
    if (!subscriptionPlan) {
      return false; // No active subscription
    }

    return gym._count.collaborators < subscriptionPlan.maxUsersPerGym;
  }

  /**
   * List all organizations (SUPER_ADMIN only) with enhanced subscription data
   */
  async listOrganizations(_context: IRequestContext): Promise<ListOrganizationsResponseDto[]> {
    // Permission check is handled by the guard

    const organizations = await this.prismaService.organization.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        gyms: {
          where: {
            deletedAt: null,
          },
          select: {
            id: true,
            name: true,
            address: true,
            _count: {
              select: {
                gymClients: {
                  where: { deletedAt: null },
                },
                collaborators: {
                  where: { 
                    status: 'active',
                    deletedAt: null,
                  },
                },
              },
            },
          },
        },
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Map organizations with enhanced subscription data
    return await Promise.all(
      organizations.map(async (org) => {
        const activeSubscription = org.subscriptionOrganizations[0];
        
        // Calculate usage statistics
        const totalClients = org.gyms.reduce((sum, gym) => sum + gym._count.gymClients, 0);
        const totalCollaborators = org.gyms.reduce((sum, gym) => sum + gym._count.collaborators, 0);
        
        let subscription: any = undefined;
        let usage: any = undefined;

        if (activeSubscription) {
          // Get subscription period information
          const subscriptionPeriod = this.dateManager.getSubscriptionPeriod(activeSubscription);
          
          subscription = {
            id: activeSubscription.id,
            planId: activeSubscription.subscriptionPlanId,
            planName: activeSubscription.subscriptionPlan.name,
            status: activeSubscription.status,
            startDate: activeSubscription.startDate.toISOString(),
            endDate: activeSubscription.endDate.toISOString(),
            isExpiring: subscriptionPeriod.isExpiring,
            isExpired: subscriptionPeriod.isExpired,
            daysUntilExpiration: subscriptionPeriod.daysUntilExpiration,
          };

          // Calculate usage percentages
          const plan = activeSubscription.subscriptionPlan;
          usage = {
            gyms: {
              current: org.gyms.length,
              limit: plan.maxGyms,
              percentage: plan.maxGyms > 0 ? Math.round((org.gyms.length / plan.maxGyms) * 100 * 100) / 100 : 0,
            },
            clients: {
              current: totalClients,
              limit: plan.maxClientsPerGym * plan.maxGyms,
              percentage: 
                plan.maxClientsPerGym * plan.maxGyms > 0 
                  ? Math.round((totalClients / (plan.maxClientsPerGym * plan.maxGyms)) * 100 * 100) / 100 
                  : 0,
            },
            collaborators: {
              current: totalCollaborators,
              limit: plan.maxUsersPerGym * plan.maxGyms,
              percentage:
                plan.maxUsersPerGym * plan.maxGyms > 0
                  ? Math.round((totalCollaborators / (plan.maxUsersPerGym * plan.maxGyms)) * 100 * 100) / 100
                  : 0,
            },
          };
        }

        return {
          id: org.id,
          name: org.name,
          owner: {
            id: org.owner.id,
            email: org.owner.email,
            fullName: org.owner.name || '',
          },
          gyms: org.gyms.map((gym) => ({
            id: gym.id,
            name: gym.name,
            address: gym.address || '',
          })),
          createdAt: org.createdAt,
          subscription,
          usage,
          locale: {
            country: org.country,
            currency: org.currency,
            timezone: org.timezone,
          },
        };
      })
    );
  }

  /**
   * Get detailed organization information with subscription data (SUPER_ADMIN only)
   */
  async getOrganizationById(_context: IRequestContext, organizationId: string): Promise<any> {
    const organization = await this.prismaService.organization.findUnique({
      where: {
        id: organizationId,
        deletedAt: null,
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        gyms: {
          where: {
            deletedAt: null,
          },
          include: {
            _count: {
              select: {
                gymClients: {
                  where: { deletedAt: null },
                },
                collaborators: {
                  where: { 
                    status: 'active',
                    deletedAt: null,
                  },
                },
              },
            },
          },
        },
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
      },
    });

    if (!organization) {
      throw new ResourceNotFoundException('Organization', organizationId);
    }

    const activeSubscription = organization.subscriptionOrganizations[0];
    
    // Calculate usage statistics
    const totalClients = organization.gyms.reduce((sum, gym) => sum + gym._count.gymClients, 0);
    const totalCollaborators = organization.gyms.reduce((sum, gym) => sum + gym._count.collaborators, 0);

    // Get recent subscription operations
    const recentOperations = await this.prismaService.subscriptionOperation.findMany({
      where: {
        organizationId,
        deletedAt: null,
      },
      include: {
        fromSubscriptionPlan: {
          select: { name: true },
        },
        toSubscriptionPlan: {
          select: { name: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    let currentSubscription: any = null;
    let plan: any = null;
    let usage: any = null;
    let billing: any = null;

    if (activeSubscription) {
      // Get subscription period information
      const subscriptionPeriod = this.dateManager.getSubscriptionPeriod(activeSubscription);
      
      currentSubscription = {
        id: activeSubscription.id,
        planId: activeSubscription.subscriptionPlanId,
        planName: activeSubscription.subscriptionPlan.name,
        status: activeSubscription.status,
        startDate: activeSubscription.startDate.toISOString(),
        endDate: activeSubscription.endDate.toISOString(),
        isExpiring: subscriptionPeriod.isExpiring,
        isExpired: subscriptionPeriod.isExpired,
        daysUntilExpiration: subscriptionPeriod.daysUntilExpiration,
      };

      plan = {
        id: activeSubscription.subscriptionPlan.id,
        name: activeSubscription.subscriptionPlan.name,
        description: activeSubscription.subscriptionPlan.description,
        price: activeSubscription.subscriptionPlan.price,
        billingFrequency: activeSubscription.subscriptionPlan.billingFrequency,
        maxGyms: activeSubscription.subscriptionPlan.maxGyms,
        maxClientsPerGym: activeSubscription.subscriptionPlan.maxClientsPerGym,
        maxUsersPerGym: activeSubscription.subscriptionPlan.maxUsersPerGym,
        features: activeSubscription.subscriptionPlan.features,
      };

      // Calculate usage percentages
      const planLimits = activeSubscription.subscriptionPlan;
      usage = {
        gyms: {
          current: organization.gyms.length,
          limit: planLimits.maxGyms,
          percentage: planLimits.maxGyms > 0 ? Math.round((organization.gyms.length / planLimits.maxGyms) * 100 * 100) / 100 : 0,
        },
        clients: {
          current: totalClients,
          limit: planLimits.maxClientsPerGym * planLimits.maxGyms,
          percentage: 
            planLimits.maxClientsPerGym * planLimits.maxGyms > 0 
              ? Math.round((totalClients / (planLimits.maxClientsPerGym * planLimits.maxGyms)) * 100 * 100) / 100 
              : 0,
        },
        collaborators: {
          current: totalCollaborators,
          limit: planLimits.maxUsersPerGym * planLimits.maxGyms,
          percentage:
            planLimits.maxUsersPerGym * planLimits.maxGyms > 0
              ? Math.round((totalCollaborators / (planLimits.maxUsersPerGym * planLimits.maxGyms)) * 100 * 100) / 100
              : 0,
        },
      };

      // Billing and renewal information
      billing = {
        renewalWindow: {
          startDate: subscriptionPeriod.renewalWindow.startDate.toISOString(),
          endDate: subscriptionPeriod.renewalWindow.endDate.toISOString(),
          isActive: subscriptionPeriod.renewalWindow.isActive,
        },
        nextBillingDate: subscriptionPeriod.next?.startDate?.toISOString(),
        canRenew: this.dateManager.isInRenewalWindow(activeSubscription),
        canUpgrade: !subscriptionPeriod.isExpired,
        canDowngrade: !subscriptionPeriod.isExpired,
      };
    }

    return {
      organization: {
        id: organization.id,
        name: organization.name,
        country: organization.country,
        currency: organization.currency,
        timezone: organization.timezone,
        createdAt: organization.createdAt.toISOString(),
      },
      currentSubscription,
      plan,
      usage,
      billing,
      recentOperations: recentOperations.map(op => ({
        id: op.id,
        operationType: op.operationType,
        effectiveDate: op.effectiveDate.toISOString(),
        fromPlanName: op.fromSubscriptionPlan?.name,
        toPlanName: op.toSubscriptionPlan?.name,
        prorationAmount: op.prorationAmount ? parseFloat(op.prorationAmount.toString()) : undefined,
        createdAt: op.createdAt.toISOString(),
      })),
      gyms: organization.gyms.map(gym => ({
        id: gym.id,
        name: gym.name,
        address: gym.address || '',
        isActive: gym.isActive,
        clientsCount: gym._count.gymClients,
        collaboratorsCount: gym._count.collaborators,
      })),
    };
  }
}
