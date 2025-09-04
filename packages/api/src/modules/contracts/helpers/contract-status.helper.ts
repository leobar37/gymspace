import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { ContractStatus } from '@prisma/client';
import dayjs from 'dayjs';
import { CONTRACT_EXPIRATION_CONSTANTS } from '../constants/contract-expiration.constants';

@Injectable()
export class ContractStatusHelper {
  private readonly logger = new Logger(ContractStatusHelper.name);

  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Update contracts to expiring_soon status (within 7 days of expiration)
   */
  async updateExpiringSoonContracts(gymId?: string): Promise<number> {
    const today = new Date();
    const sevenDaysFromNow = dayjs(today).add(7, 'days').toDate();

    const baseWhere = gymId
      ? { gymClient: { gymId }, deletedAt: null }
      : { deletedAt: null };

    const result = await this.prismaService.contract.updateMany({
      where: {
        ...baseWhere,
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

    if (result.count > 0) {
      this.logger.log(`Updated ${result.count} contracts to expiring_soon status`);
    }

    return result.count;
  }

  /**
   * Update contracts to expired status and activate their renewals
   */
  async processExpiredContracts(gymId?: string): Promise<{
    expiredCount: number;
    renewalsActivated: number;
    errors: Array<{ contractId: string; error: string }>;
  }> {
    const today = new Date();
    const baseWhere = gymId
      ? { gymClient: { gymId }, deletedAt: null }
      : { deletedAt: null };

    // Find contracts that should be expired
    const contractsToExpire = await this.prismaService.contract.findMany({
      where: {
        ...baseWhere,
        status: {
          in: [ContractStatus.active, ContractStatus.expiring_soon],
        },
        endDate: {
          lt: today,
        },
      },
      select: {
        id: true,
        status: true,
        endDate: true,
        renewals: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          select: {
            id: true,
            status: true,
            finalAmount: true,
          },
        },
      },
    });

    let expiredCount = 0;
    let renewalsActivated = 0;
    const errors: Array<{ contractId: string; error: string }> = [];

    // Process each contract individually
    for (const contract of contractsToExpire) {
      try {
        await this.prismaService.$transaction(async (prisma) => {
          // Update contract to expired
          await prisma.contract.update({
            where: { id: contract.id },
            data: {
              status: ContractStatus.expired,
              updatedAt: today,
            },
          });
          expiredCount++;

          // Check if there's a renewal to activate
          const renewal = contract.renewals[0];
          if (renewal && renewal.finalAmount && Number(renewal.finalAmount) > 0) {
            // Activate the renewal (it already has its dates set)
            await prisma.contract.update({
              where: { id: renewal.id },
              data: {
                status: ContractStatus.active,
                updatedAt: today,
              },
            });
            renewalsActivated++;
            
            this.logger.log(
              `Contract ${contract.id} expired and renewal ${renewal.id} activated`
            );
          } else if (renewal) {
            this.logger.log(
              `Contract ${contract.id} expired but renewal ${renewal.id} not activated (no payment)`
            );
          } else {
            this.logger.log(`Contract ${contract.id} expired without renewal`);
          }
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push({
          contractId: contract.id,
          error: errorMessage,
        });
        this.logger.error(
          `Failed to process contract ${contract.id}: ${errorMessage}`
        );
      }
    }

    return {
      expiredCount,
      renewalsActivated,
      errors,
    };
  }

  /**
   * Main process to update all contract statuses
   */
  async updateContractStatuses(gymId?: string): Promise<{
    expiringSoonCount: number;
    expiredCount: number;
    renewalsActivated: number;
    errors: Array<{ contractId: string; error: string }>;
    executionTime: number;
  }> {
    const startTime = Date.now();

    // Step 1: Update contracts to expiring_soon
    const expiringSoonCount = await this.updateExpiringSoonContracts(gymId);

    // Step 2: Update contracts to expired and activate renewals
    const expiredResult = await this.processExpiredContracts(gymId);

    const executionTime = Date.now() - startTime;

    this.logger.log(
      `Contract status update completed in ${executionTime}ms. ` +
      `Expiring Soon: ${expiringSoonCount}, Expired: ${expiredResult.expiredCount}, ` +
      `Renewals Activated: ${expiredResult.renewalsActivated}`
    );

    if (expiredResult.errors.length > 0) {
      this.logger.warn('Errors during processing', { errors: expiredResult.errors });
    }

    return {
      expiringSoonCount,
      expiredCount: expiredResult.expiredCount,
      renewalsActivated: expiredResult.renewalsActivated,
      errors: expiredResult.errors,
      executionTime,
    };
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
   * Manual trigger for contract status update
   */
  /**
   * Process frozen contracts and reactivate them if freeze period has ended
   */
  async processFrozenContracts(gymId?: string): Promise<{
    reactivatedCount: number;
    stillFrozenCount: number;
    errors: Array<{ contractId: string; error: string }>;
  }> {
    const today = new Date();
    const baseWhere = gymId
      ? { gymClient: { gymId }, deletedAt: null }
      : { deletedAt: null };

    // Find frozen contracts
    const frozenContracts = await this.prismaService.contract.findMany({
      where: {
        ...baseWhere,
        status: ContractStatus.frozen,
        freezeEndDate: {
          not: null,
        },
      },
      select: {
        id: true,
        freezeEndDate: true,
        endDate: true,
      },
    });

    let reactivatedCount = 0;
    let stillFrozenCount = 0;
    const errors: Array<{ contractId: string; error: string }> = [];

    // Process each frozen contract
    for (const contract of frozenContracts) {
      try {
        if (contract.freezeEndDate && contract.freezeEndDate <= today) {
          // Freeze period has ended, reactivate the contract
          await this.prismaService.contract.update({
            where: { id: contract.id },
            data: {
              status: ContractStatus.active,
              freezeStartDate: null,
              freezeEndDate: null,
              updatedAt: today,
            },
          });
          reactivatedCount++;
          
          this.logger.log(
            `Contract ${contract.id} reactivated after freeze period ended`
          );
        } else {
          // Contract is still frozen
          stillFrozenCount++;
          this.logger.log(
            `Contract ${contract.id} remains frozen until ${contract.freezeEndDate}`
          );
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push({
          contractId: contract.id,
          error: errorMessage,
        });
        this.logger.error(
          `Failed to process frozen contract ${contract.id}: ${errorMessage}`
        );
      }
    }

    this.logger.log(
      `Frozen contracts processing completed: ${reactivatedCount} reactivated, ${stillFrozenCount} still frozen`
    );

    return {
      reactivatedCount,
      stillFrozenCount,
      errors,
    };
  }

  async triggerContractStatusUpdate(): Promise<{
    expiringSoonCount: number;
    expiredCount: number;
    renewalsActivated: number;
    executionTime: number;
  }> {
    const result = await this.updateContractStatuses();
    
    return {
      expiringSoonCount: result.expiringSoonCount,
      expiredCount: result.expiredCount,
      renewalsActivated: result.renewalsActivated,
      executionTime: result.executionTime,
    };
  }
}