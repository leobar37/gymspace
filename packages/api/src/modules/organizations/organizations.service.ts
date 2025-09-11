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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return organizations.map((org) => ({
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
    }));
  }
}
