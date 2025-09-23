import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { CacheService } from '../../core/cache/cache.service';
import { UpdateOrganizationDto, ListOrganizationsResponseDto } from './dto';
import { ResourceNotFoundException } from '../../common/exceptions';
import { RequestContext } from '../../common/services/request-context.service';
import { Organization } from '@prisma/client';
import { IRequestContext } from '@gymspace/shared';

@Injectable()
export class OrganizationsService {
  constructor(
    private prismaService: PrismaService,
    private cacheService: CacheService,
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
   * Get organization details for super admin with full subscription data
   */
  async getOrganizationForAdmin(
    context: RequestContext,
    organizationId: string,
  ): Promise<any> {
    const organization = await this.prismaService.organization.findUnique({
      where: {
        id: organizationId,
        deletedAt: null,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
          },
        },
        gyms: {
          where: {
            deletedAt: null,
          },
          include: {
            _count: {
              select: {
                gymClients: true,
                collaborators: true,
                contracts: true,
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

    const activeSubscription = organization.subscriptionOrganizations[0];
    const now = new Date();

    const totalClients = organization.gyms.reduce((sum, gym) => sum + gym._count.gymClients, 0);
    const totalCollaborators = organization.gyms.reduce((sum, gym) => sum + gym._count.collaborators, 0);
    const activeContracts = organization.gyms.reduce((sum, gym) => sum + gym._count.contracts, 0);

    return {
      id: organization.id,
      name: organization.name,
      country: organization.country,
      currency: organization.currency,
      timezone: organization.timezone,
      hasUsedFreeTrial: organization.hasUsedFreeTrial,
      owner: organization.owner,
      gyms: organization.gyms.map(gym => ({
        id: gym.id,
        name: gym.name,
        address: gym.address,
        phone: gym.phone,
        email: gym.email,
        stats: {
          clients: gym._count.gymClients,
          collaborators: gym._count.collaborators,
          contracts: gym._count.contracts,
        },
        createdAt: gym.createdAt,
      })),
      subscription: activeSubscription
        ? {
            id: activeSubscription.id,
            planId: activeSubscription.subscriptionPlanId,
            planName: activeSubscription.subscriptionPlan.name,
            status: activeSubscription.status,
            startDate: activeSubscription.startDate,
            endDate: activeSubscription.endDate,
            isActive: activeSubscription.isActive,
            isExpired: now > activeSubscription.endDate,
            daysRemaining: Math.max(
              0,
              Math.ceil((activeSubscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
            ),
            price: activeSubscription.subscriptionPlan.price,
            limits: {
              maxGyms: activeSubscription.subscriptionPlan.maxGyms,
              maxClientsPerGym: activeSubscription.subscriptionPlan.maxClientsPerGym,
              maxUsersPerGym: activeSubscription.subscriptionPlan.maxUsersPerGym,
            },
            features: activeSubscription.subscriptionPlan.features,
            metadata: activeSubscription.metadata,
          }
        : null,
      usage: {
        gyms: {
          current: organization.gyms.length,
          limit: activeSubscription?.subscriptionPlan.maxGyms || 0,
          percentage: activeSubscription
            ? Math.round((organization.gyms.length / activeSubscription.subscriptionPlan.maxGyms) * 100)
            : 0,
        },
        totalClients: {
          current: totalClients,
          limit: activeSubscription
            ? activeSubscription.subscriptionPlan.maxClientsPerGym * activeSubscription.subscriptionPlan.maxGyms
            : 0,
          percentage: activeSubscription
            ? Math.round(
                (totalClients /
                  (activeSubscription.subscriptionPlan.maxClientsPerGym *
                    activeSubscription.subscriptionPlan.maxGyms)) *
                  100,
              )
            : 0,
        },
        totalCollaborators: {
          current: totalCollaborators,
          limit: activeSubscription
            ? activeSubscription.subscriptionPlan.maxUsersPerGym * activeSubscription.subscriptionPlan.maxGyms
            : 0,
          percentage: activeSubscription
            ? Math.round(
                (totalCollaborators /
                  (activeSubscription.subscriptionPlan.maxUsersPerGym *
                    activeSubscription.subscriptionPlan.maxGyms)) *
                  100,
              )
            : 0,
        },
      },
      metrics: {
        totalClients,
        activeContracts,
        totalCollaborators,
        gymsCount: organization.gyms.length,
      },
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
    };
  }

  /**
   * List all organizations (SUPER_ADMIN only)
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
          },
        },
        subscriptionOrganizations: {
          where: {
            isActive: true,
            deletedAt: null,
          },
          include: {
            subscriptionPlan: {
              select: {
                name: true,
              },
            },
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return organizations.map((org) => {
      const activeSubscription = org.subscriptionOrganizations[0];
      const now = new Date();

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
        subscription: activeSubscription
          ? {
              planName: activeSubscription.subscriptionPlan.name,
              status: activeSubscription.status as any,
              startDate: activeSubscription.startDate,
              endDate: activeSubscription.endDate,
              isExpired: now > activeSubscription.endDate,
            }
          : undefined,
        createdAt: org.createdAt,
      };
    });
  }
}
