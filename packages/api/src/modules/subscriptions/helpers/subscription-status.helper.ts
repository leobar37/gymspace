import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { SubscriptionStatus } from '@prisma/client';
import dayjs from 'dayjs';

interface SubscriptionStats {
  total: number;
  active: number;
  expiringSoon: number;
  expired: number;
  needsUpdate: {
    expiringSoon: number;
    expired: number;
    total: number;
  };
}

interface ExpiredProcessingResult {
  expiredCount: number;
  gracePeriodExtended: number;
  organizationsNotified: number;
  errors: Array<{ organizationId: string; error: string }>;
}

interface GracePeriodProcessingResult {
  gracePeriodEnded: number;
  accessSuspended: number;
  errors: Array<{ organizationId: string; error: string }>;
}

@Injectable()
export class SubscriptionStatusHelper {
  private readonly logger = new Logger(SubscriptionStatusHelper.name);
  private readonly EXPIRATION_WARNING_DAYS = 7;
  private readonly GRACE_PERIOD_DAYS = 3;

  constructor(private readonly prismaService: PrismaService) {}

  async getSubscriptionStatusStats(): Promise<SubscriptionStats> {
    const baseWhere = { deletedAt: null, isActive: true };

    const [activeCount, expiringSoonCount, expiredCount, totalCount] = await Promise.all([
      this.prismaService.subscriptionOrganization.count({
        where: {
          ...baseWhere,
          status: SubscriptionStatus.active,
        },
      }),
      this.prismaService.subscriptionOrganization.count({
        where: {
          ...baseWhere,
          status: SubscriptionStatus.active,
          metadata: {
            path: ['expirationWarning'],
            equals: true,
          },
        },
      }),
      this.prismaService.subscriptionOrganization.count({
        where: {
          ...baseWhere,
          status: SubscriptionStatus.expired,
        },
      }),
      this.prismaService.subscriptionOrganization.count({
        where: baseWhere,
      }),
    ]);

    const needsUpdate = await this.getSubscriptionsNeedingStatusUpdate();

    return {
      active: activeCount,
      expiringSoon: expiringSoonCount,
      expired: expiredCount,
      total: totalCount,
      needsUpdate,
    };
  }

  async updateExpiringSoonSubscriptions(): Promise<number> {
    const today = new Date();
    const warningDate = dayjs(today).add(this.EXPIRATION_WARNING_DAYS, 'days').toDate();

    const subscriptionsToUpdate = await this.prismaService.subscriptionOrganization.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        status: SubscriptionStatus.active,
        endDate: {
          gte: today,
          lte: warningDate,
        },
        OR: [
          {
            metadata: {
              path: ['expirationWarning'],
              equals: null,
            },
          },
          {
            metadata: {
              path: ['expirationWarning'],
              not: true,
            },
          },
        ],
      },
      select: {
        id: true,
        metadata: true,
      },
    });

    let updateCount = 0;

    for (const subscription of subscriptionsToUpdate) {
      try {
        const currentMetadata = (subscription.metadata as any) || {};
        const updatedMetadata = {
          ...currentMetadata,
          expirationWarning: true,
          warningDate: today.toISOString(),
        };

        await this.prismaService.subscriptionOrganization.update({
          where: { id: subscription.id },
          data: {
            metadata: updatedMetadata,
            updatedAt: today,
          },
        });

        updateCount++;
        this.logger.log(`Subscription ${subscription.id} marked with expiration warning`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to update subscription ${subscription.id}: ${errorMessage}`);
      }
    }

    if (updateCount > 0) {
      this.logger.log(`Updated ${updateCount} subscriptions with expiration warnings`);
    }

    return updateCount;
  }

  async processExpiredSubscriptions(): Promise<ExpiredProcessingResult> {
    const today = new Date();
    let expiredCount = 0;
    let gracePeriodExtended = 0;
    let organizationsNotified = 0;
    const errors: Array<{ organizationId: string; error: string }> = [];

    const subscriptionsToExpire = await this.prismaService.subscriptionOrganization.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        status: SubscriptionStatus.active,
        endDate: {
          lt: today,
        },
      },
      select: {
        id: true,
        organizationId: true,
        endDate: true,
        metadata: true,
      },
    });

    for (const subscription of subscriptionsToExpire) {
      try {
        await this.prismaService.$transaction(async (tx) => {
          const currentMetadata = (subscription.metadata as any) || {};
          const gracePeriodStart = today;
          const gracePeriodEnd = dayjs(today).add(this.GRACE_PERIOD_DAYS, 'days').toDate();

          const updatedMetadata = {
            ...currentMetadata,
            gracePeriodStart: gracePeriodStart.toISOString(),
            gracePeriodEnd: gracePeriodEnd.toISOString(),
            expiredAt: today.toISOString(),
          };

          await tx.subscriptionOrganization.update({
            where: { id: subscription.id },
            data: {
              status: SubscriptionStatus.expired,
              metadata: updatedMetadata,
              updatedAt: today,
            },
          });
        });

        expiredCount++;
        gracePeriodExtended++;
        organizationsNotified++;

        this.logger.log(
          `Subscription ${subscription.id} for organization ${subscription.organizationId} marked as expired with ${this.GRACE_PERIOD_DAYS}-day grace period`,
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push({
          organizationId: subscription.organizationId,
          error: errorMessage,
        });
        this.logger.error(
          `Failed to process expired subscription for organization ${subscription.organizationId}: ${errorMessage}`,
        );
      }
    }

    return {
      expiredCount,
      gracePeriodExtended,
      organizationsNotified,
      errors,
    };
  }

  async processGracePeriodSubscriptions(): Promise<GracePeriodProcessingResult> {
    const today = new Date();
    let gracePeriodEnded = 0;
    let accessSuspended = 0;
    const errors: Array<{ organizationId: string; error: string }> = [];

    const gracePeriodSubscriptions = await this.prismaService.subscriptionOrganization.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        status: SubscriptionStatus.expired,
        metadata: {
          path: ['gracePeriodEnd'],
          not: null,
        },
      },
      select: {
        id: true,
        organizationId: true,
        metadata: true,
      },
    });

    for (const subscription of gracePeriodSubscriptions) {
      try {
        const metadata = (subscription.metadata as any) || {};
        const gracePeriodEnd = metadata.gracePeriodEnd ? new Date(metadata.gracePeriodEnd) : null;

        if (gracePeriodEnd && gracePeriodEnd <= today) {
          await this.prismaService.$transaction(async (tx) => {
            const updatedMetadata = {
              ...metadata,
              gracePeriodEnded: today.toISOString(),
              accessSuspended: true,
            };

            await tx.subscriptionOrganization.update({
              where: { id: subscription.id },
              data: {
                status: SubscriptionStatus.inactive,
                metadata: updatedMetadata,
                updatedAt: today,
              },
            });
          });

          gracePeriodEnded++;
          accessSuspended++;

          this.logger.log(
            `Grace period ended for subscription ${subscription.id} (organization ${subscription.organizationId}). Access suspended.`,
          );
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push({
          organizationId: subscription.organizationId,
          error: errorMessage,
        });
        this.logger.error(
          `Failed to process grace period for organization ${subscription.organizationId}: ${errorMessage}`,
        );
      }
    }

    return {
      gracePeriodEnded,
      accessSuspended,
      errors,
    };
  }

  private async getSubscriptionsNeedingStatusUpdate(): Promise<{
    expiringSoon: number;
    expired: number;
    total: number;
  }> {
    const today = new Date();
    const warningDate = dayjs(today).add(this.EXPIRATION_WARNING_DAYS, 'days').toDate();

    const baseWhere = { deletedAt: null, isActive: true };

    const expiringSoonCount = await this.prismaService.subscriptionOrganization.count({
      where: {
        ...baseWhere,
        status: SubscriptionStatus.active,
        endDate: {
          gte: today,
          lte: warningDate,
        },
        OR: [
          {
            metadata: {
              path: ['expirationWarning'],
              equals: null,
            },
          },
          {
            metadata: {
              path: ['expirationWarning'],
              not: true,
            },
          },
        ],
      },
    });

    const expiredCount = await this.prismaService.subscriptionOrganization.count({
      where: {
        ...baseWhere,
        status: SubscriptionStatus.active,
        endDate: {
          lt: today,
        },
      },
    });

    return {
      expiringSoon: expiringSoonCount,
      expired: expiredCount,
      total: expiringSoonCount + expiredCount,
    };
  }
}