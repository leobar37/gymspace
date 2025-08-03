import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { CacheService } from '../../core/cache/cache.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { CreateGymDto, UpdateGymDto } from './dto';
import { BusinessException, ResourceNotFoundException } from '../../common/exceptions';
import { Gym } from '@prisma/client';

@Injectable()
export class GymsService {
  constructor(
    private prismaService: PrismaService,
    private cacheService: CacheService,
    private organizationsService: OrganizationsService,
  ) {}

  /**
   * Create a new gym (CU-004)
   */
  async createGym(organizationId: string, dto: CreateGymDto, userId: string): Promise<Gym> {
    // Check if organization can add more gyms
    const canAdd = await this.organizationsService.canAddGym(organizationId);
    if (!canAdd) {
      throw new BusinessException('Gym limit reached for this subscription plan');
    }

    // Generate unique slug
    const slug = await this.generateUniqueSlug(dto.name);

    // Generate unique gym code
    const gymCode = await this.generateUniqueGymCode();

    // Create gym
    const gym = await this.prismaService.gym.create({
      data: {
        ...dto,
        slug,
        gymCode,
        organizationId,
        isActive: true,
        createdByUserId: userId,
      },
      include: {
        organization: {
          select: {
            id: true,
            country: true,
            currency: true,
            timezone: true,
          },
        },
      },
    });

    return gym;
  }

  /**
   * Update gym details (CU-005)
   */
  async updateGym(gymId: string, dto: UpdateGymDto, userId: string): Promise<Gym> {
    // Verify gym exists and user has access
    const gym = await this.prismaService.gym.findFirst({
      where: {
        id: gymId,
        organization: {
          ownerUserId: userId,
        },
      },
    });

    if (!gym) {
      throw new ResourceNotFoundException('Gym', gymId);
    }

    // Update gym
    const updated = await this.prismaService.gym.update({
      where: { id: gymId },
      data: {
        ...dto,
        updatedByUserId: userId,
      },
      include: {
        organization: {
          select: {
            id: true,
            country: true,
            currency: true,
            timezone: true,
          },
        },
      },
    });

    // Invalidate cache
    await this.cacheService.del(`gym:${gymId}`);

    return updated;
  }

  /**
   * Get gym by ID
   */
  async getGym(gymId: string, userId: string): Promise<Gym> {
    const gym = await this.prismaService.gym.findFirst({
      where: {
        id: gymId,
        OR: [{ organization: { ownerUserId: userId } }, { collaborators: { some: { userId } } }],
      },
      include: {
        organization: {
          select: {
            id: true,
            country: true,
            currency: true,
            timezone: true,
            subscriptionPlan: true,
          },
        },
        _count: {
          select: {
            gymClients: true,
            collaborators: { where: { status: 'active' } },
            contracts: { where: { status: 'active' } },
          },
        },
      },
    });

    if (!gym) {
      throw new ResourceNotFoundException('Gym', gymId);
    }

    return gym;
  }

  /**
   * Get gyms for organization
   */
  async getOrganizationGyms(organizationId: string, userId: string) {
    // Verify user has access to organization
    await this.organizationsService.getOrganization(organizationId, userId);

    const gyms = await this.prismaService.gym.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            gymClients: true,
            collaborators: { where: { status: 'active' } },
            contracts: { where: { status: 'active' } },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return gyms;
  }

  /**
   * Get gym statistics
   */
  async getGymStats(gymId: string, userId: string) {
    // Verify access
    const gym = await this.getGym(gymId, userId);

    const [
      totalClients,
      activeClients,
      totalCollaborators,
      activeContracts,
      todayCheckIns,
      monthlyRevenue,
    ] = await Promise.all([
      // Total clients
      this.prismaService.gymClient.count({
        where: { gymId },
      }),
      // Active clients (with active contracts)
      this.prismaService.gymClient.count({
        where: {
          gymId,
          contracts: {
            some: { status: 'active' },
          },
        },
      }),
      // Total collaborators
      this.prismaService.collaborator.count({
        where: { gymId, status: 'active' },
      }),
      // Active contracts
      this.prismaService.contract.count({
        where: { 
          gymClient: {
            gymId
          },
          status: 'active' 
        },
      }),
      // Today's check-ins
      this.prismaService.checkIn.count({
        where: {
          gymId,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      // Monthly revenue (current month)
      this.calculateMonthlyRevenue(gymId),
    ]);

    return {
      gym: {
        id: gym.id,
        name: gym.name,
        slug: gym.slug,
        isActive: gym.isActive,
      },
      clients: {
        total: totalClients,
        active: activeClients,
        inactive: totalClients - activeClients,
      },
      collaborators: {
        total: totalCollaborators,
        limit: (gym as any).organization.subscriptionPlan.maxUsersPerGym,
        available: (gym as any).organization.subscriptionPlan.maxUsersPerGym - totalCollaborators,
      },
      contracts: {
        active: activeContracts,
      },
      activity: {
        todayCheckIns,
        monthlyRevenue,
      },
    };
  }

  /**
   * Toggle gym active status
   */
  async toggleGymStatus(gymId: string, userId: string): Promise<Gym> {
    const gym = await this.prismaService.gym.findFirst({
      where: {
        id: gymId,
        organization: { ownerUserId: userId },
      },
    });

    if (!gym) {
      throw new ResourceNotFoundException('Gym', gymId);
    }

    return this.prismaService.gym.update({
      where: { id: gymId },
      data: {
        isActive: !gym.isActive,
        updatedByUserId: userId,
      },
    });
  }

  /**
   * Check if user has access to gym
   */
  async hasGymAccess(gymId: string, userId: string): Promise<boolean> {
    const access = await this.prismaService.gym.findFirst({
      where: {
        id: gymId,
        OR: [
          { organization: { ownerUserId: userId } },
          {
            collaborators: {
              some: {
                userId,
                status: 'active',
              },
            },
          },
        ],
      },
    });

    return !!access;
  }

  /**
   * Generate unique slug for gym
   */
  private async generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let slug = baseSlug;
    let counter = 0;

    while (true) {
      const existing = await this.prismaService.gym.findUnique({
        where: { slug },
      });

      if (!existing) {
        return slug;
      }

      counter++;
      slug = `${baseSlug}-${counter}`;
    }
  }

  /**
   * Generate unique gym code
   */
  private async generateUniqueGymCode(): Promise<string> {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const gymCode = `GYM-${timestamp}-${random}`;

    // Check if it already exists
    const existing = await this.prismaService.gym.findUnique({
      where: { gymCode },
    });

    if (existing) {
      // Recursively generate a new one
      return this.generateUniqueGymCode();
    }

    return gymCode;
  }

  /**
   * Calculate monthly revenue for a gym
   */
  private async calculateMonthlyRevenue(gymId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const contracts = await this.prismaService.contract.findMany({
      where: {
        gymClient: {
          gymId,
        },
        status: 'active',
        startDate: { lte: new Date() },
      },
      include: {
        gymMembershipPlan: true,
      },
    });

    return contracts.reduce((total, contract) => {
      return total + parseFloat((contract as any).gymMembershipPlan.basePrice.toString());
    }, 0);
  }
}
