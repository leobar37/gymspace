import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { CacheService } from '../../core/cache/cache.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { CreateGymDto, UpdateGymDto, UpdateCurrentGymDto } from './dto';
import { BusinessException, ResourceNotFoundException } from '../../common/exceptions';
import { Gym } from '@prisma/client';
import { RequestContext } from '../../common/services/request-context.service';
import { BaseGymService } from './base-gym.service';

@Injectable()
export class GymsService extends BaseGymService {
  constructor(
    protected prismaService: PrismaService,
    private cacheService: CacheService,
    private organizationsService: OrganizationsService,
  ) {
    super(prismaService);
  }

  /**
   * Create a new gym (CU-004)
   */
  async createGym(context: RequestContext, dto: CreateGymDto): Promise<Gym> {
    const userId = context.getUserId();
    const organizationId = context.getOrganizationId();

    if (!organizationId) {
      throw new BusinessException('Organization context is required');
    }
    // Check if organization can add more gyms
    const canAdd = await this.organizationsService.canAddGym(context, organizationId);
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
  async updateGym(context: RequestContext, gymId: string, dto: UpdateGymDto): Promise<Gym> {
    const userId = context.getUserId();
    
    // Verify gym exists and user has access using base service
    await this.validateGymOwnership(context, gymId);

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
  async getGym(context: RequestContext, gymId: string): Promise<Gym> {
    // First validate access using base service
    await this.validateGymOwnership(context, gymId);
    
    const userId = context.getUserId();
    
    // Then get full gym details
    const gym = await this.prismaService.gym.findFirst({
      where: {
        id: gymId,
        organization: { ownerUserId: userId },
      },
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
  async getOrganizationGyms(context: RequestContext) {
    const userId = context.getUserId();
    const organizationId = context.getOrganizationId();

    if (!organizationId) {
      throw new BusinessException('Organization context is required');
    }

    // Verify user has access to organization
    await this.organizationsService.getOrganization(context, organizationId);

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
  async getGymStats(context: RequestContext, gymId: string) {
    // Verify access
    const gym = await this.getGym(context, gymId);

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
            gymId,
          },
          status: 'active',
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
        limit:
          (gym as any).organization.subscriptionOrganizations[0]?.subscriptionPlan
            ?.maxUsersPerGym || 0,
        available: Math.max(
          0,
          ((gym as any).organization.subscriptionOrganizations[0]?.subscriptionPlan
            ?.maxUsersPerGym || 0) - totalCollaborators,
        ),
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
  async toggleGymStatus(context: RequestContext, gymId: string): Promise<Gym> {
    const userId = context.getUserId();
    
    // Use base service to find gym with validation
    const gym = await this.findGymByIdWithOwnerValidation(context, gymId);

    return this.prismaService.gym.update({
      where: { id: gymId },
      data: {
        isActive: !gym.isActive,
        updatedByUserId: userId,
      },
    });
  }

  /**
   * Update current gym in session (only basic fields)
   */
  async updateCurrentGym(context: RequestContext, dto: UpdateCurrentGymDto): Promise<Gym> {
    const gymId = context.getGymId();
    const userId = context.getUserId();

    if (!gymId) {
      throw new BusinessException('Gym context is required');
    }

    // Use base service to find gym with validation
    const gym = await this.findGymByIdWithAccess(context, gymId);

    // Build update data with only the provided fields
    const updateData: any = {
      updatedByUserId: userId,
    };

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.address !== undefined) updateData.address = dto.address;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.assetId !== undefined) {
      // You might want to validate the asset exists and belongs to the gym
      updateData.settings = {
        ...((gym.settings as object) || {}),
        logoAssetId: dto.assetId,
      };
    }

    // Update gym with only basic fields
    const updated = await this.prismaService.gym.update({
      where: { id: gymId },
      data: updateData,
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

  /**
   * Update gym schedule
   */
  async updateGymSchedule(context: RequestContext, gymId: string, dto: any): Promise<Gym> {
    const userId = context.getUserId();

    // Use base service to validate gym access
    await this.validateGymOwnership(context, gymId);

    return await this.prismaService.gym.update({
      where: { id: gymId },
      data: {
        schedule: dto,
        updatedByUserId: userId,
      },
    });
  }

  /**
   * Update gym social media
   */
  async updateGymSocialMedia(context: RequestContext, gymId: string, dto: any): Promise<Gym> {
    const userId = context.getUserId();

    // Use base service to validate gym access
    await this.validateGymOwnership(context, gymId);

    return await this.prismaService.gym.update({
      where: { id: gymId },
      data: {
        socialMedia: dto,
        updatedByUserId: userId,
      },
    });
  }
}
