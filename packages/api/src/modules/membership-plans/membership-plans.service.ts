import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { GymsService } from '../gyms/gyms.service';
import { BusinessException, ResourceNotFoundException } from '../../common/exceptions';
import { CreateMembershipPlanDto, UpdateMembershipPlanDto } from './dto';
import { GymMembershipPlan, PlanStatus } from '@prisma/client';
import { IRequestContext } from '@gymspace/shared';

@Injectable()
export class GymMembershipPlansService {
  constructor(
    private prismaService: PrismaService,
    private gymsService: GymsService,
  ) {}

  /**
   * Create a new membership plan (CU-010)
   */
  async createGymMembershipPlan(
    context: IRequestContext,
    dto: CreateMembershipPlanDto,
  ): Promise<GymMembershipPlan> {
    const gymId = context.getGymId();
    const userId = context.getUserId();
    
    if (!gymId) {
      throw new BusinessException('Gym context is required');
    }
    
    // Verify gym access and get gym with organization
    const gym = await this.prismaService.gym.findFirst({
      where: {
        id: gymId,
        OR: [
          { organization: { ownerUserId: userId } },
          { collaborators: { some: { userId, status: 'active' } } },
        ],
      },
      include: {
        organization: {
          select: {
            currency: true,
          },
        },
      },
    });

    if (!gym) {
      throw new ResourceNotFoundException('Gym', gymId);
    }

    // Validate that at least one duration is provided
    if (!dto.durationMonths && !dto.durationDays) {
      throw new BusinessException('Either durationMonths or durationDays must be provided');
    }

    // Check if plan name already exists in this gym
    const existingPlan = await this.prismaService.gymMembershipPlan.findFirst({
      where: {
        name: dto.name,
        gymId,
      },
    });

    if (existingPlan) {
      throw new BusinessException('A membership plan with this name already exists');
    }

    // Create membership plan
    const plan = await this.prismaService.gymMembershipPlan.create({
      data: {
        name: dto.name,
        description: dto.description,
        basePrice: dto.basePrice,
        durationMonths: dto.durationMonths || null,
        durationDays: dto.durationDays || null,
        features: dto.features,
        termsAndConditions: dto.termsAndConditions,
        allowsCustomPricing: dto.allowsCustomPricing || false,
        maxEvaluations: dto.maxEvaluations || 0,
        includesAdvisor: dto.includesAdvisor || false,
        showInCatalog: dto.showInCatalog || false,
        assetsIds: dto.assetsIds || [],
        status: PlanStatus.active,
        gymId,
        createdByUserId: userId,
      },
      include: {
        gym: {
          select: {
            id: true,
            name: true,
            organization: {
              select: {
                currency: true,
              },
            },
          },
        },
        _count: {
          select: {
            contracts: true,
          },
        },
      },
    });

    return plan;
  }

  /**
   * Update membership plan (CU-011)
   */
  async updateGymMembershipPlan(
    context: IRequestContext,
    planId: string,
    dto: UpdateMembershipPlanDto,
  ): Promise<GymMembershipPlan> {
    const userId = context.getUserId();
    
    // Verify plan exists and user has access
    const plan = await this.prismaService.gymMembershipPlan.findFirst({
      where: {
        id: planId,
        gym: {
          OR: [
            { organization: { ownerUserId: userId } },
            { collaborators: { some: { userId, status: 'active' } } },
          ],
        },
      },
    });

    if (!plan) {
      throw new ResourceNotFoundException('GymMembershipPlan', planId);
    }

    // Validate duration logic
    if (dto.durationMonths !== undefined || dto.durationDays !== undefined) {
      // If updating duration, ensure at least one is provided
      const finalDurationMonths = dto.durationMonths !== undefined ? dto.durationMonths : plan.durationMonths;
      const finalDurationDays = dto.durationDays !== undefined ? dto.durationDays : plan.durationDays;
      
      if (!finalDurationMonths && !finalDurationDays) {
        throw new BusinessException('Either durationMonths or durationDays must be provided');
      }
    }

    // If name is being updated, check uniqueness within gym
    if (dto.name && dto.name !== plan.name) {
      const nameExists = await this.prismaService.gymMembershipPlan.findFirst({
        where: {
          name: dto.name,
          gymId: plan.gymId,
          id: { not: planId },
        },
      });

      if (nameExists) {
        throw new BusinessException('A membership plan with this name already exists');
      }
    }

    // Check if plan can be deactivated
    if (dto.status === PlanStatus.inactive) {
      const activeContracts = await this.prismaService.contract.count({
        where: {
          gymMembershipPlanId: planId,
          status: 'active',
        },
      });

      if (activeContracts > 0) {
        throw new BusinessException('Cannot deactivate plan with active contracts');
      }
    }

    // Update plan
    const updated = await this.prismaService.gymMembershipPlan.update({
      where: { id: planId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.basePrice !== undefined && { basePrice: dto.basePrice }),
        ...(dto.durationMonths !== undefined && { durationMonths: dto.durationMonths }),
        ...(dto.durationDays !== undefined && { durationDays: dto.durationDays }),
        ...(dto.features !== undefined && { features: dto.features }),
        ...(dto.termsAndConditions !== undefined && { termsAndConditions: dto.termsAndConditions }),
        ...(dto.allowsCustomPricing !== undefined && {
          allowsCustomPricing: dto.allowsCustomPricing,
        }),
        ...(dto.maxEvaluations !== undefined && { maxEvaluations: dto.maxEvaluations }),
        ...(dto.includesAdvisor !== undefined && { includesAdvisor: dto.includesAdvisor }),
        ...(dto.showInCatalog !== undefined && { showInCatalog: dto.showInCatalog }),
        ...(dto.assetsIds !== undefined && { assetsIds: dto.assetsIds }),
        ...(dto.status && { status: dto.status as PlanStatus }),
        updatedByUserId: userId,
      },
      include: {
        gym: {
          select: {
            id: true,
            name: true,
            organization: {
              select: {
                currency: true,
              },
            },
          },
        },
        _count: {
          select: {
            contracts: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Get membership plan by ID
   */
  async getGymMembershipPlan(context: IRequestContext, planId: string): Promise<GymMembershipPlan> {
    const userId = context.getUserId();
    
    const plan = await this.prismaService.gymMembershipPlan.findFirst({
      where: {
        id: planId,
        gym: {
          OR: [
            { organization: { ownerUserId: userId } },
            { collaborators: { some: { userId, status: 'active' } } },
          ],
        },
      },
      include: {
        gym: {
          select: {
            id: true,
            name: true,
            organization: {
              select: {
                currency: true,
              },
            },
          },
        },
        _count: {
          select: {
            contracts: true,
          },
        },
      },
    });

    if (!plan) {
      throw new ResourceNotFoundException('GymMembershipPlan', planId);
    }

    return plan;
  }

  /**
   * Get all membership plans for a gym
   */
  async getGymGymMembershipPlans(context: IRequestContext, activeOnly = false) {
    const gymId = context.getGymId();
    const userId = context.getUserId();
    
    if (!gymId) {
      throw new BusinessException('Gym context is required');
    }
    
    // Verify gym access
    const hasAccess = await this.gymsService.hasGymAccess(gymId, userId);
    if (!hasAccess) {
      throw new ResourceNotFoundException('Gym', gymId);
    }

    const where: any = { gymId };
    if (activeOnly) {
      where.status = PlanStatus.active;
    }

    const plans = await this.prismaService.gymMembershipPlan.findMany({
      where,
      include: {
        _count: {
          select: {
            contracts: true,
          },
        },
      },
      orderBy: [
        { status: 'desc' }, // Active plans first
        { basePrice: 'asc' }, // Then by price
      ],
    });

    return plans;
  }

  /**
   * Get membership plan statistics
   */
  async getGymMembershipPlanStats(context: IRequestContext, planId: string) {
    const plan = await this.getGymMembershipPlan(context, planId);

    const [totalContracts, activeContracts, cancelledContracts, monthlyRevenue, averageRetention] =
      await Promise.all([
        // Total contracts
        this.prismaService.contract.count({
          where: { gymMembershipPlanId: planId },
        }),
        // Active contracts
        this.prismaService.contract.count({
          where: {
            gymMembershipPlanId: planId,
            status: 'active',
          },
        }),
        // Cancelled contracts
        this.prismaService.contract.count({
          where: {
            gymMembershipPlanId: planId,
            status: 'cancelled',
          },
        }),
        // Monthly revenue
        this.calculatePlanMonthlyRevenue(planId),
        // Average retention in days
        this.calculateAverageRetention(planId),
      ]);

    // Get recent contracts
    const recentContracts = await this.prismaService.contract.findMany({
      where: { gymMembershipPlanId: planId },
      include: {
        gymClient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
      take: 10,
    });

    return {
      plan: {
        id: plan.id,
        name: plan.name,
        basePrice: plan.basePrice,
        durationMonths: plan.durationMonths,
        durationDays: plan.durationDays,
        status: plan.status,
      },
      contracts: {
        total: totalContracts,
        active: activeContracts,
        cancelled: cancelledContracts,
        retentionRate:
          totalContracts > 0 ? ((activeContracts / totalContracts) * 100).toFixed(2) : 0,
      },
      revenue: {
        monthly: monthlyRevenue,
        projected: monthlyRevenue * 12,
      },
      metrics: {
        averageRetentionDays: averageRetention,
      },
      recentContracts,
    };
  }

  /**
   * Delete (soft delete) membership plan
   */
  async deleteGymMembershipPlan(context: IRequestContext, planId: string): Promise<GymMembershipPlan> {
    const userId = context.getUserId();
    
    const plan = await this.prismaService.gymMembershipPlan.findFirst({
      where: {
        id: planId,
        gym: {
          organization: { ownerUserId: userId },
        },
      },
    });

    if (!plan) {
      throw new ResourceNotFoundException('GymMembershipPlan', planId);
    }

    // Check for active contracts
    const activeContracts = await this.prismaService.contract.count({
      where: {
        gymMembershipPlanId: planId,
        status: 'active',
      },
    });

    if (activeContracts > 0) {
      throw new BusinessException('Cannot delete plan with active contracts');
    }

    return this.prismaService.gymMembershipPlan.update({
      where: { id: planId },
      data: {
        status: PlanStatus.archived,
        deletedAt: new Date(),
        updatedByUserId: userId,
      },
    });
  }

  /**
   * Calculate monthly revenue for a plan
   */
  private async calculatePlanMonthlyRevenue(planId: string): Promise<number> {
    const plan = await this.prismaService.gymMembershipPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) return 0;

    const activeContracts = await this.prismaService.contract.count({
      where: {
        gymMembershipPlanId: planId,
        status: 'active',
      },
    });

    // Calculate monthly revenue based on plan duration
    let monthsEquivalent = 1;
    if (plan.durationMonths) {
      monthsEquivalent = plan.durationMonths;
    } else if (plan.durationDays) {
      monthsEquivalent = plan.durationDays / 30;
    }
    const monthlyRevenue = (Number(plan.basePrice) / monthsEquivalent) * activeContracts;
    return monthlyRevenue;
  }

  /**
   * Calculate average retention for a plan
   */
  private async calculateAverageRetention(planId: string): Promise<number> {
    const contracts = await this.prismaService.contract.findMany({
      where: {
        gymMembershipPlanId: planId,
        status: 'expired',
      },
    });

    if (contracts.length === 0) return 0;

    const totalDays = contracts.reduce((sum, contract) => {
      const days = Math.floor(
        (contract.endDate!.getTime() - contract.startDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      return sum + days;
    }, 0);

    return Math.round(totalDays / contracts.length);
  }
}
