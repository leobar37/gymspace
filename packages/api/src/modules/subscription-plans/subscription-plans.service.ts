import { IRequestContext } from '@gymspace/shared';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { BusinessException, ResourceNotFoundException } from '../../common/exceptions';
import {
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
  SubscriptionPlanDto,
} from './dto';

@Injectable()
export class SubscriptionPlansService {
  constructor(private readonly prisma: PrismaService) {}

  async listPlans(context: IRequestContext): Promise<SubscriptionPlanDto[]> {
    const plans = await this.prisma.subscriptionPlan.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            subscriptionOrganizations: {
              where: {
                isActive: true,
                deletedAt: null,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      price: plan.price as any,
      billingFrequency: plan.billingFrequency,
      duration: plan.duration,
      durationPeriod: plan.durationPeriod,
      maxGyms: plan.maxGyms,
      maxClientsPerGym: plan.maxClientsPerGym,
      maxUsersPerGym: plan.maxUsersPerGym,
      features: plan.features as any,
      description: plan.description,
      isActive: plan.isActive,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
      activeSubscriptions: plan._count.subscriptionOrganizations,
      totalOrganizations: plan._count.subscriptionOrganizations,
    }));
  }

  async createPlan(
    context: IRequestContext,
    dto: CreateSubscriptionPlanDto,
  ): Promise<SubscriptionPlanDto> {
    const existingPlan = await this.prisma.subscriptionPlan.findFirst({
      where: {
        name: dto.name,
        deletedAt: null,
      },
    });

    if (existingPlan) {
      throw new BusinessException(`A plan with the name "${dto.name}" already exists`);
    }

    const plan = await this.prisma.subscriptionPlan.create({
      data: {
        name: dto.name,
        price: dto.price as any,
        billingFrequency: dto.billingFrequency,
        duration: dto.duration,
        durationPeriod: dto.durationPeriod,
        maxGyms: dto.maxGyms,
        maxClientsPerGym: dto.maxClientsPerGym,
        maxUsersPerGym: dto.maxUsersPerGym,
        features: dto.features,
        description: dto.description,
        isActive: dto.isActive ?? true,
        createdByUserId: context.getUserId() || null,
      },
      include: {
        _count: {
          select: {
            subscriptionOrganizations: {
              where: {
                isActive: true,
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    return {
      id: plan.id,
      name: plan.name,
      price: plan.price as any,
      billingFrequency: plan.billingFrequency,
      duration: plan.duration,
      durationPeriod: plan.durationPeriod,
      maxGyms: plan.maxGyms,
      maxClientsPerGym: plan.maxClientsPerGym,
      maxUsersPerGym: plan.maxUsersPerGym,
      features: plan.features as any,
      description: plan.description,
      isActive: plan.isActive,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
      activeSubscriptions: plan._count.subscriptionOrganizations,
      totalOrganizations: plan._count.subscriptionOrganizations,
    };
  }

  async getPlan(context: IRequestContext, id: string): Promise<SubscriptionPlanDto> {
    const plan = await this.prisma.subscriptionPlan.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            subscriptionOrganizations: {
              where: {
                isActive: true,
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    if (!plan) {
      throw new ResourceNotFoundException('Subscription plan not found');
    }

    return {
      id: plan.id,
      name: plan.name,
      price: plan.price as any,
      billingFrequency: plan.billingFrequency,
      duration: plan.duration,
      durationPeriod: plan.durationPeriod,
      maxGyms: plan.maxGyms,
      maxClientsPerGym: plan.maxClientsPerGym,
      maxUsersPerGym: plan.maxUsersPerGym,
      features: plan.features as any,
      description: plan.description,
      isActive: plan.isActive,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
      activeSubscriptions: plan._count.subscriptionOrganizations,
      totalOrganizations: plan._count.subscriptionOrganizations,
    };
  }

  async updatePlan(
    context: IRequestContext,
    id: string,
    dto: UpdateSubscriptionPlanDto,
  ): Promise<SubscriptionPlanDto> {
    const existingPlan = await this.prisma.subscriptionPlan.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existingPlan) {
      throw new ResourceNotFoundException('Subscription plan not found');
    }

    if (dto.name && dto.name !== existingPlan.name) {
      const nameConflict = await this.prisma.subscriptionPlan.findFirst({
        where: {
          name: dto.name,
          deletedAt: null,
          id: {
            not: id,
          },
        },
      });

      if (nameConflict) {
        throw new BusinessException(`A plan with the name "${dto.name}" already exists`);
      }
    }

    const plan = await this.prisma.subscriptionPlan.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.price !== undefined && { price: dto.price as any }),
        ...(dto.billingFrequency !== undefined && { billingFrequency: dto.billingFrequency }),
        ...(dto.duration !== undefined && { duration: dto.duration }),
        ...(dto.durationPeriod !== undefined && { durationPeriod: dto.durationPeriod }),
        ...(dto.maxGyms !== undefined && { maxGyms: dto.maxGyms }),
        ...(dto.maxClientsPerGym !== undefined && { maxClientsPerGym: dto.maxClientsPerGym }),
        ...(dto.maxUsersPerGym !== undefined && { maxUsersPerGym: dto.maxUsersPerGym }),
        ...(dto.features !== undefined && { features: dto.features }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        updatedByUserId: context.getUserId() || null,
      },
      include: {
        _count: {
          select: {
            subscriptionOrganizations: {
              where: {
                isActive: true,
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    return {
      id: plan.id,
      name: plan.name,
      price: plan.price as any,
      billingFrequency: plan.billingFrequency,
      duration: plan.duration,
      durationPeriod: plan.durationPeriod,
      maxGyms: plan.maxGyms,
      maxClientsPerGym: plan.maxClientsPerGym,
      maxUsersPerGym: plan.maxUsersPerGym,
      features: plan.features as any,
      description: plan.description,
      isActive: plan.isActive,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
      activeSubscriptions: plan._count.subscriptionOrganizations,
      totalOrganizations: plan._count.subscriptionOrganizations,
    };
  }

  async deletePlan(context: IRequestContext, id: string): Promise<{ success: boolean }> {
    const plan = await this.prisma.subscriptionPlan.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            subscriptionOrganizations: {
              where: {
                isActive: true,
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    if (!plan) {
      throw new ResourceNotFoundException('Subscription plan not found');
    }

    if (plan._count.subscriptionOrganizations > 0) {
      throw new BusinessException(
        'Cannot delete a plan that has active subscriptions. Please deactivate the plan instead.',
      );
    }

    await this.prisma.subscriptionPlan.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedByUserId: context.getUserId() || null,
      },
    });

    return { success: true };
  }
}