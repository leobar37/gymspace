import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { CacheService } from '../../core/cache/cache.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { ResourceNotFoundException } from '../../common/exceptions';
import { Organization } from '@prisma/client';

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
    organizationId: string,
    userId: string,
  ): Promise<Organization & { subscriptionPlan: any }> {
    const organization = await this.prismaService.organization.findFirst({
      where: {
        id: organizationId,
        ownerUserId: userId,
      },
      include: {
        subscriptionPlan: true,
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

    return organization as Organization & { subscriptionPlan: any };
  }

  /**
   * Update organization settings
   */
  async updateOrganization(
    organizationId: string,
    dto: UpdateOrganizationDto,
    userId: string,
  ): Promise<Organization> {
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

    // Update organization
    const updated = await this.prismaService.organization.update({
      where: { id: organizationId },
      data: {
        ...dto,
        updatedByUserId: userId,
      },
      include: {
        subscriptionPlan: true,
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
    await this.cacheService.del(`org:${organizationId}`);

    return updated;
  }

  /**
   * Get organization statistics
   */
  async getOrganizationStats(organizationId: string, userId: string) {
    // Verify ownership
    const organization = await this.getOrganization(organizationId, userId);

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
          percentage: (gymsCount / org.subscriptionPlan.maxGyms) * 100,
        },
        clients: {
          current: totalClients,
          limit:
            org.subscriptionPlan.maxClientsPerGym * org.subscriptionPlan.maxGyms,
          percentage:
            (totalClients /
              (org.subscriptionPlan.maxClientsPerGym *
                org.subscriptionPlan.maxGyms)) *
            100,
        },
        collaborators: {
          current: totalCollaborators,
          limit:
            org.subscriptionPlan.maxUsersPerGym * org.subscriptionPlan.maxGyms,
          percentage:
            (totalCollaborators /
              (org.subscriptionPlan.maxUsersPerGym *
                org.subscriptionPlan.maxGyms)) *
            100,
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
  async canAddGym(organizationId: string): Promise<boolean> {
    const organization = await this.prismaService.organization.findUnique({
      where: { id: organizationId },
      include: {
        subscriptionPlan: true,
        _count: {
          select: { gyms: true },
        },
      },
    });

    if (!organization) {
      throw new ResourceNotFoundException('Organization', organizationId);
    }

    return organization._count.gyms < organization.subscriptionPlan.maxGyms;
  }

  /**
   * Check if gym can add more clients
   */
  async canAddClient(gymId: string): Promise<boolean> {
    const gym = await this.prismaService.gym.findUnique({
      where: { id: gymId },
      include: {
        organization: {
          include: {
            subscriptionPlan: true,
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

    return gym._count.gymClients < gym.organization.subscriptionPlan.maxClientsPerGym;
  }

  /**
   * Check if gym can add more collaborators
   */
  async canAddCollaborator(gymId: string): Promise<boolean> {
    const gym = await this.prismaService.gym.findUnique({
      where: { id: gymId },
      include: {
        organization: {
          include: {
            subscriptionPlan: true,
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

    return gym._count.collaborators < gym.organization.subscriptionPlan.maxUsersPerGym;
  }
}
