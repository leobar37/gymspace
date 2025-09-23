import { IRequestContext, SubscriptionStatus } from '@gymspace/shared';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { BusinessException, ResourceNotFoundException } from '../../common/exceptions';
import dayjs from 'dayjs';
import {
  ActivateRenewalDto,
  CancelSubscriptionDto,
  UpgradeSubscriptionDto,
  SubscriptionStatusDto,
  SubscriptionHistoryDto,
} from './dto';

@Injectable()
export class AdminSubscriptionManagementService {
  constructor(private readonly prisma: PrismaService) {}

  async activateRenewal(
    context: IRequestContext,
    organizationId: string,
    dto: ActivateRenewalDto,
  ): Promise<SubscriptionStatusDto> {
    const organization = await this.prisma.organization.findUnique({
      where: {
        id: organizationId,
        deletedAt: null,
      },
      include: {
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
      throw new ResourceNotFoundException('Organization not found');
    }

    const currentSubscription = organization.subscriptionOrganizations[0];
    if (!currentSubscription) {
      throw new BusinessException('No active subscription found for this organization');
    }

    let newPlan = currentSubscription.subscriptionPlan;
    if (dto.subscriptionPlanId) {
      newPlan = await this.prisma.subscriptionPlan.findFirst({
        where: {
          id: dto.subscriptionPlanId,
          deletedAt: null,
          isActive: true,
        },
      });

      if (!newPlan) {
        throw new ResourceNotFoundException('Subscription plan not found');
      }
    }

    const startDate = new Date();
    let endDate: Date;

    if (dto.durationMonths) {
      endDate = dayjs(startDate).add(dto.durationMonths, 'month').toDate();
    } else if (newPlan.duration && newPlan.durationPeriod) {
      if (newPlan.durationPeriod === 'MONTH') {
        endDate = dayjs(startDate).add(newPlan.duration, 'month').toDate();
      } else {
        endDate = dayjs(startDate).add(newPlan.duration, 'day').toDate();
      }
    } else {
      endDate = dayjs(startDate).add(1, 'month').toDate();
    }

    const metadata = {
      ...(currentSubscription.metadata as any || {}),
      renewalActivatedBy: context.getUserId(),
      renewalActivatedAt: new Date().toISOString(),
      ...(dto.notes && { renewalNotes: dto.notes }),
      ...(dto.subscriptionPlanId && {
        previousPlanId: currentSubscription.subscriptionPlanId,
        previousPlanName: currentSubscription.subscriptionPlan.name,
      }),
    };

    const newSubscription = await this.prisma.$transaction(async (prisma) => {
      await prisma.subscriptionOrganization.update({
        where: {
          id: currentSubscription.id,
        },
        data: {
          isActive: false,
          metadata: {
            ...(currentSubscription.metadata as any || {}),
            deactivationReason: 'renewal',
            deactivatedAt: new Date().toISOString(),
          },
          updatedByUserId: context.getUserId(),
        },
      });

      return await prisma.subscriptionOrganization.create({
        data: {
          organizationId,
          subscriptionPlanId: newPlan.id,
          status: SubscriptionStatus.ACTIVE,
          startDate,
          endDate,
          isActive: true,
          metadata,
          createdByUserId: context.getUserId(),
        },
        include: {
          subscriptionPlan: true,
        },
      });
    });

    const daysRemaining = Math.max(
      0,
      Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
    );

    return {
      id: newSubscription.id,
      organizationId: newSubscription.organizationId,
      subscriptionPlanId: newSubscription.subscriptionPlanId,
      planName: newSubscription.subscriptionPlan.name,
      status: newSubscription.status as SubscriptionStatus,
      startDate: newSubscription.startDate,
      endDate: newSubscription.endDate,
      isActive: newSubscription.isActive,
      isExpired: false,
      daysRemaining,
      metadata: newSubscription.metadata as any,
      createdAt: newSubscription.createdAt,
      updatedAt: newSubscription.updatedAt,
    };
  }

  async cancelSubscription(
    context: IRequestContext,
    organizationId: string,
    dto: CancelSubscriptionDto,
  ): Promise<SubscriptionStatusDto> {
    const organization = await this.prisma.organization.findUnique({
      where: {
        id: organizationId,
        deletedAt: null,
      },
      include: {
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
      throw new ResourceNotFoundException('Organization not found');
    }

    const currentSubscription = organization.subscriptionOrganizations[0];
    if (!currentSubscription) {
      throw new BusinessException('No active subscription found for this organization');
    }

    const now = new Date();
    const effectiveEndDate = dto.immediateTermination ? now : currentSubscription.endDate;
    const newStatus = dto.immediateTermination
      ? SubscriptionStatus.INACTIVE
      : SubscriptionStatus.ACTIVE;

    const metadata = {
      ...(currentSubscription.metadata as any || {}),
      cancellationReason: dto.reason,
      cancelledBy: context.getUserId(),
      cancelledAt: now.toISOString(),
      immediateTermination: dto.immediateTermination || false,
      ...(dto.notes && { cancellationNotes: dto.notes }),
      ...(!dto.immediateTermination && { pendingCancellation: true, scheduledCancellationDate: currentSubscription.endDate.toISOString() }),
    };

    const updatedSubscription = await this.prisma.subscriptionOrganization.update({
      where: {
        id: currentSubscription.id,
      },
      data: {
        status: newStatus,
        endDate: effectiveEndDate,
        metadata,
        updatedByUserId: context.getUserId(),
      },
      include: {
        subscriptionPlan: true,
      },
    });

    const daysRemaining = Math.max(
      0,
      Math.ceil((effectiveEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    );

    return {
      id: updatedSubscription.id,
      organizationId: updatedSubscription.organizationId,
      subscriptionPlanId: updatedSubscription.subscriptionPlanId,
      planName: updatedSubscription.subscriptionPlan.name,
      status: updatedSubscription.status as SubscriptionStatus,
      startDate: updatedSubscription.startDate,
      endDate: updatedSubscription.endDate,
      isActive: updatedSubscription.isActive,
      isExpired: now > updatedSubscription.endDate,
      daysRemaining,
      metadata: updatedSubscription.metadata as any,
      createdAt: updatedSubscription.createdAt,
      updatedAt: updatedSubscription.updatedAt,
    };
  }

  async upgradeSubscription(
    context: IRequestContext,
    organizationId: string,
    dto: UpgradeSubscriptionDto,
  ): Promise<SubscriptionStatusDto> {
    const organization = await this.prisma.organization.findUnique({
      where: {
        id: organizationId,
        deletedAt: null,
      },
      include: {
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
        gyms: {
          where: {
            deletedAt: null,
          },
          include: {
            _count: {
              select: {
                gymClients: true,
                collaborators: true,
              },
            },
          },
        },
      },
    });

    if (!organization) {
      throw new ResourceNotFoundException('Organization not found');
    }

    const currentSubscription = organization.subscriptionOrganizations[0];
    if (!currentSubscription) {
      throw new BusinessException('No active subscription found for this organization');
    }

    const newPlan = await this.prisma.subscriptionPlan.findFirst({
      where: {
        id: dto.newSubscriptionPlanId,
        deletedAt: null,
        isActive: true,
      },
    });

    if (!newPlan) {
      throw new ResourceNotFoundException('Subscription plan not found');
    }

    if (currentSubscription.subscriptionPlanId === newPlan.id) {
      throw new BusinessException('Organization is already on this plan');
    }

    const gymCount = organization.gyms.length;
    const maxClients = Math.max(
      ...organization.gyms.map((gym) => gym._count.gymClients),
      0,
    );
    const maxUsers = Math.max(
      ...organization.gyms.map((gym) => gym._count.collaborators + 1),
      0,
    );

    if (gymCount > newPlan.maxGyms) {
      throw new BusinessException(
        `Cannot upgrade to this plan. Organization has ${gymCount} gyms but plan allows only ${newPlan.maxGyms}`,
      );
    }

    if (maxClients > newPlan.maxClientsPerGym) {
      throw new BusinessException(
        `Cannot upgrade to this plan. At least one gym has ${maxClients} clients but plan allows only ${newPlan.maxClientsPerGym} per gym`,
      );
    }

    if (maxUsers > newPlan.maxUsersPerGym) {
      throw new BusinessException(
        `Cannot upgrade to this plan. At least one gym has ${maxUsers} users but plan allows only ${newPlan.maxUsersPerGym} per gym`,
      );
    }

    const immediateUpgrade = dto.immediateUpgrade !== false;
    const startDate = immediateUpgrade ? new Date() : currentSubscription.endDate;
    let endDate: Date;

    if (newPlan.duration && newPlan.durationPeriod) {
      if (newPlan.durationPeriod === 'MONTH') {
        endDate = dayjs(startDate).add(newPlan.duration, 'month').toDate();
      } else {
        endDate = dayjs(startDate).add(newPlan.duration, 'day').toDate();
      }
    } else {
      endDate = dayjs(startDate).add(1, 'month').toDate();
    }

    const metadata = {
      upgradedFrom: currentSubscription.subscriptionPlan.name,
      upgradedTo: newPlan.name,
      upgradedBy: context.getUserId(),
      upgradedAt: new Date().toISOString(),
      immediateUpgrade,
      ...(dto.notes && { upgradeNotes: dto.notes }),
    };

    const newSubscription = await this.prisma.$transaction(async (prisma) => {
      if (immediateUpgrade) {
        await prisma.subscriptionOrganization.update({
          where: {
            id: currentSubscription.id,
          },
          data: {
            isActive: false,
            status: SubscriptionStatus.INACTIVE,
            endDate: new Date(),
            metadata: {
              ...(currentSubscription.metadata as any || {}),
              deactivationReason: 'upgrade',
              deactivatedAt: new Date().toISOString(),
            },
            updatedByUserId: context.getUserId(),
          },
        });

        return await prisma.subscriptionOrganization.create({
          data: {
            organizationId,
            subscriptionPlanId: newPlan.id,
            status: SubscriptionStatus.ACTIVE,
            startDate,
            endDate,
            isActive: true,
            metadata,
            createdByUserId: context.getUserId(),
          },
          include: {
            subscriptionPlan: true,
          },
        });
      } else {
        await prisma.subscriptionOrganization.update({
          where: {
            id: currentSubscription.id,
          },
          data: {
            status: SubscriptionStatus.PENDING_UPGRADE,
            metadata: {
              ...(currentSubscription.metadata as any || {}),
              pendingUpgrade: {
                newPlanId: newPlan.id,
                newPlanName: newPlan.name,
                upgradeDate: startDate.toISOString(),
                ...metadata,
              },
            },
            updatedByUserId: context.getUserId(),
          },
        });

        return await prisma.subscriptionOrganization.findUnique({
          where: {
            id: currentSubscription.id,
          },
          include: {
            subscriptionPlan: true,
          },
        });
      }
    });

    const daysRemaining = Math.max(
      0,
      Math.ceil((newSubscription.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
    );

    return {
      id: newSubscription.id,
      organizationId: newSubscription.organizationId,
      subscriptionPlanId: newSubscription.subscriptionPlanId,
      planName: newSubscription.subscriptionPlan.name,
      status: newSubscription.status as SubscriptionStatus,
      startDate: newSubscription.startDate,
      endDate: newSubscription.endDate,
      isActive: newSubscription.isActive,
      isExpired: false,
      daysRemaining,
      metadata: newSubscription.metadata as any,
      createdAt: newSubscription.createdAt,
      updatedAt: newSubscription.updatedAt,
    };
  }

  async getSubscriptionHistory(
    context: IRequestContext,
    organizationId: string,
  ): Promise<SubscriptionHistoryDto[]> {
    const organization = await this.prisma.organization.findUnique({
      where: {
        id: organizationId,
        deletedAt: null,
      },
    });

    if (!organization) {
      throw new ResourceNotFoundException('Organization not found');
    }

    const subscriptions = await this.prisma.subscriptionOrganization.findMany({
      where: {
        organizationId,
        deletedAt: null,
      },
      include: {
        subscriptionPlan: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return subscriptions.map((sub) => ({
      id: sub.id,
      planName: sub.subscriptionPlan.name,
      status: sub.status as SubscriptionStatus,
      startDate: sub.startDate,
      endDate: sub.endDate,
      isActive: sub.isActive,
      metadata: sub.metadata as any,
      createdBy: {
        id: sub.createdBy.id,
        name: sub.createdBy.name,
        email: sub.createdBy.email,
      },
      createdAt: sub.createdAt,
    }));
  }
}