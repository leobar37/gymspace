import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../../core/database/prisma.service';
import { ContractStatus } from '@prisma/client';
import * as dateFns from 'date-fns';
import { CONTRACT_EXPIRATION_CONSTANTS } from '../constants/contract-expiration.constants';

@Injectable()
export class ContractStatusHelper {
  private readonly logger = new Logger(ContractStatusHelper.name);

  constructor(private readonly prismaService: PrismaService) {}

  async updateExpiringSoonContracts(): Promise<number> {
    const today = new Date();
    const sevenDaysFromNow = dateFns.addDays(today, 7);

    const result = await this.prismaService.contract.updateMany({
      where: {
        status: ContractStatus.active,
        endDate: {
          gte: today,
          lte: sevenDaysFromNow,
        },
      },
      data: {
        status: ContractStatus.expiring_soon,
      },
    });

    return result.count;
  }

  async updateExpiredContracts(): Promise<number> {
    const today = new Date();

    const result = await this.prismaService.contract.updateMany({
      where: {
        status: {
          in: [ContractStatus.active, ContractStatus.expiring_soon],
        },
        endDate: {
          lt: today,
        },
      },
      data: {
        status: ContractStatus.expired,
      },
    });

    return result.count;
  }

  async updateContractStatuses(): Promise<void> {
    await Promise.all([
      this.updateExpiringSoonContracts(),
      this.updateExpiredContracts(),
    ]);
  }

  /**
   * Check if a contract is expiring soon based on its end date
   */
  isContractExpiringSoon(contract: { status: string; endDate: Date | null }): boolean {
    if (!contract.endDate || contract.status !== 'active') {
      return false;
    }

    const now = new Date();
    const warningDate = new Date();
    warningDate.setDate(now.getDate() + CONTRACT_EXPIRATION_CONSTANTS.EXPIRING_SOON_DAYS);

    return contract.endDate <= warningDate && contract.endDate > now;
  }

  /**
   * Check if a contract is expired based on its end date and grace period
   */
  isContractExpired(contract: { status: string; endDate: Date | null }): boolean {
    if (!contract.endDate) {
      return false;
    }

    const now = new Date();
    const expirationThreshold = new Date(now);

    if (CONTRACT_EXPIRATION_CONSTANTS.GRACE_PERIOD_DAYS > 0) {
      expirationThreshold.setDate(now.getDate() - CONTRACT_EXPIRATION_CONSTANTS.GRACE_PERIOD_DAYS);
    }

    return (
      (contract.status === 'active' || contract.status === 'expiring_soon') &&
      contract.endDate <= expirationThreshold
    );
  }

  /**
   * Get contracts that need status update
   */
  async getContractsNeedingStatusUpdate(gymId?: string): Promise<{
    expiringSoon: number;
    expired: number;
    total: number;
  }> {
    const now = new Date();
    const warningDate = new Date();
    warningDate.setDate(now.getDate() + CONTRACT_EXPIRATION_CONSTANTS.EXPIRING_SOON_DAYS);

    // Base where clause
    const baseWhere = gymId
      ? { gymClient: { gymId }, deletedAt: null }
      : { deletedAt: null };

    // Count contracts that should be marked as expiring_soon
    const expiringSoonCount = await this.prismaService.contract.count({
      where: {
        ...baseWhere,
        status: ContractStatus.active,
        endDate: {
          gte: now,
          lte: warningDate,
        },
      },
    });

    // Count contracts that should be marked as expired
    const expiredCount = await this.prismaService.contract.count({
      where: {
        ...baseWhere,
        status: {
          in: [ContractStatus.active, ContractStatus.expiring_soon],
        },
        endDate: {
          lt: now,
        },
      },
    });

    return {
      expiringSoon: expiringSoonCount,
      expired: expiredCount,
      total: expiringSoonCount + expiredCount,
    };
  }

  /**
   * Get contract status statistics for monitoring
   */
  async getContractStatusStats(gymId?: string) {
    const now = new Date();
    const warningDate = new Date();
    warningDate.setDate(now.getDate() + CONTRACT_EXPIRATION_CONSTANTS.EXPIRING_SOON_DAYS);

    const baseWhere = gymId
      ? { gymClient: { gymId }, deletedAt: null }
      : { deletedAt: null };

    const [activeCount, expiringSoonCount, expiredCount, totalCount] = await Promise.all([
      this.prismaService.contract.count({
        where: {
          ...baseWhere,
          status: ContractStatus.active,
        },
      }),
      this.prismaService.contract.count({
        where: {
          ...baseWhere,
          status: ContractStatus.expiring_soon,
        },
      }),
      this.prismaService.contract.count({
        where: {
          ...baseWhere,
          status: ContractStatus.expired,
        },
      }),
      this.prismaService.contract.count({
        where: baseWhere,
      }),
    ]);

    return {
      active: activeCount,
      expiringSoon: expiringSoonCount,
      expired: expiredCount,
      total: totalCount,
      needsUpdate: await this.getContractsNeedingStatusUpdate(gymId),
    };
  }

  /**
   * Cron job to update contract statuses automatically
   */
  @Cron(CONTRACT_EXPIRATION_CONSTANTS.CRON_SCHEDULE)
  async handleContractStatusCron() {
    const startTime = new Date();
    this.logger.log('Starting intelligent contract status update');

    try {
      // Step 1: Update contracts to expiring_soon
      const expiringSoonCount = await this.updateExpiringSoonContracts();

      // Step 2: Update contracts to expired
      const expiredCount = await this.updateExpiredContracts();

      // Step 3: Log summary
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      this.logger.log(
        `Contract status update completed in ${duration}ms. ` +
          `Updated ${expiringSoonCount} to expiring_soon, ${expiredCount} to expired.`,
      );

      // Step 4: Get stats for monitoring (optional)
      // Uncomment if you want to log stats in debug mode
      // const stats = await this.getContractStatusStats();
      // this.logger.debug('Current contract status stats:', stats);
    } catch (error) {
      this.logger.error('Error updating contract statuses', error.stack);
      throw error;
    }
  }

  /**
   * Manual trigger for contract status update
   */
  async triggerContractStatusUpdate(): Promise<{
    expiringSoonCount: number;
    expiredCount: number;
    executionTime: number;
  }> {
    const startTime = Date.now();

    const expiringSoonCount = await this.updateExpiringSoonContracts();
    const expiredCount = await this.updateExpiredContracts();

    const executionTime = Date.now() - startTime;

    this.logger.log(
      `Manual contract status update completed. ` +
        `Updated ${expiringSoonCount} to expiring_soon, ${expiredCount} to expired.`,
    );

    return {
      expiringSoonCount,
      expiredCount,
      executionTime,
    };
  }
}