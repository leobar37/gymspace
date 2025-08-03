import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { GymsService } from '../gyms/gyms.service';
import { BusinessException, ResourceNotFoundException } from '../../common/exceptions';
import { CreateMembershipPlanDto, UpdateMembershipPlanDto } from './dto';
import { GymMembershipPlan, PlanStatus } from '@prisma/client';

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
    gymId: string,
    dto: CreateMembershipPlanDto,
    userId: string,
  ): Promise<GymMembershipPlan> {
    // Verify gym access
    const hasAccess = await this.gymsService.hasGymAccess(gymId, userId);
    if (!hasAccess) {
      throw new ResourceNotFoundException('Gym', gymId);
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
        basePrice: dto.price,
        currency: dto.currency || 'USD',
        durationMonths: dto.durationMonths,
        features: dto.features,
        termsAndConditions: dto.termsAndConditions,
        allowsCustomPricing: dto.allowsCustomPricing || false,
        maxEvaluations: dto.maxEvaluations || 0,
        includesAdvisor: dto.includesAdvisor || false,
        showInCatalog: dto.showInCatalog || false,
        status: PlanStatus.active,
        gymId,
        createdByUserId: userId,
      },
      include: {
        gym: {
          select: {
            id: true,
            name: true,
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
    planId: string,
    dto: UpdateMembershipPlanDto,
    userId: string,
  ): Promise<GymMembershipPlan> {
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
        ...(dto.price !== undefined && { basePrice: dto.price }),
        ...(dto.currency && { currency: dto.currency }),
        ...(dto.durationMonths !== undefined && { durationMonths: dto.durationMonths }),
        ...(dto.features !== undefined && { features: dto.features }),
        ...(dto.termsAndConditions !== undefined && { termsAndConditions: dto.termsAndConditions }),
        ...(dto.allowsCustomPricing !== undefined && { allowsCustomPricing: dto.allowsCustomPricing }),
        ...(dto.maxEvaluations !== undefined && { maxEvaluations: dto.maxEvaluations }),
        ...(dto.includesAdvisor !== undefined && { includesAdvisor: dto.includesAdvisor }),
        ...(dto.showInCatalog !== undefined && { showInCatalog: dto.showInCatalog }),
        ...(dto.status && { status: dto.status as PlanStatus }),
        updatedByUserId: userId,
      },
      include: {
        gym: {
          select: {
            id: true,
            name: true,
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
  async getGymMembershipPlan(planId: string, userId: string): Promise<GymMembershipPlan> {
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
  async getGymGymMembershipPlans(gymId: string, userId: string, activeOnly = false) {
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
  async getGymMembershipPlanStats(planId: string, userId: string) {
    const plan = await this.getGymMembershipPlan(planId, userId);

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
        currency: plan.currency,
        durationMonths: plan.durationMonths,
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
  async deleteGymMembershipPlan(planId: string, userId: string): Promise<GymMembershipPlan> {
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
    const monthlyRevenue = (Number(plan.basePrice) / plan.durationMonths) * activeContracts;
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
