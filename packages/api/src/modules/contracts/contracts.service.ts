import { ContractStatus, IRequestContext } from '@gymspace/shared';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Contract, Prisma } from '@prisma/client';
import { BusinessException, ResourceNotFoundException } from '../../common/exceptions';
import { RequestContext } from '../../common/services/request-context.service';
import { PrismaService } from '../../core/database/prisma.service';
import { ClientsService } from '../clients/clients.service';
import { GymsService } from '../gyms/gyms.service';
import { CreateContractDto, FreezeContractDto, RenewContractDto } from './dto';
import {
  CONTRACT_EXPIRATION_CONSTANTS,
  CONTRACT_STATUS_TRANSITIONS,
} from './constants/contract-expiration.constants';

@Injectable()
export class ContractsService {
  private readonly logger = new Logger(ContractsService.name);

  constructor(
    private prismaService: PrismaService,
    private gymsService: GymsService,
    private clientsService: ClientsService,
  ) {}

  /**
   * Create a new contract (CU-012)
   */
  async createContract(context: IRequestContext, dto: CreateContractDto): Promise<Contract> {
    const gymId = context.getGymId();
    const userId = context.getUserId();

    if (!gymId) {
      throw new BusinessException('El contexto del gimnasio es requerido');
    }

    // Verify gym access and get gym with organization for currency
    const gym = context.gym;
    if (!gym) {
      throw new ResourceNotFoundException('Gimnasio', gymId);
    }

    // Verify client belongs to this gym
    const client = await this.prismaService.gymClient.findFirst({
      where: {
        id: dto.gymClientId,
        gymId,
      },
    });

    if (!client) {
      throw new ResourceNotFoundException('Cliente', dto.gymClientId);
    }

    // Check if client has active contract
    // Consider both status and dates, including expiring_soon
    const now = new Date();
    const existingContracts = await this.prismaService.contract.findMany({
      where: {
        gymClientId: dto.gymClientId,
        deletedAt: null, // Explicitly check for non-deleted contracts
        OR: [
          // Active contracts (including expiring_soon)
          { status: 'active' },
          { status: 'expiring_soon' },
          // Pending contracts that haven't started yet
          {
            status: 'pending',
            startDate: { gte: now },
          },
        ],
      },
    });

    if (existingContracts.length > 0) {
      const activeContract = existingContracts[0];

      // Provide more specific error message
      if (activeContract.status === 'active') {
        throw new BusinessException('El cliente ya tiene un contrato activo');
      } else if (activeContract.status === 'expiring_soon') {
        throw new BusinessException(
          'El cliente tiene un contrato activo que está por vencer. Considere renovarlo en lugar de crear uno nuevo',
        );
      } else if (activeContract.status === 'pending') {
        throw new BusinessException(
          'El cliente tiene un contrato pendiente que aún no ha iniciado',
        );
      }
    }

    // Run intelligent contract status update to ensure accurate status
    // This ensures expired contracts are properly marked before creating new ones
    await this.updateExpiringSoonContracts();
    await this.updateExpiredContracts();

    // Verify membership plan belongs to this gym and is active
    const plan = await this.prismaService.gymMembershipPlan.findFirst({
      where: {
        id: dto.gymMembershipPlanId,
        gymId,
        status: 'active',
      },
    });

    if (!plan) {
      throw new ResourceNotFoundException('Plan de membresía', dto.gymMembershipPlanId);
    }

    // Calculate price
    let finalPrice = dto.customPrice || Number(plan.basePrice);
    if (dto.discountPercentage) {
      finalPrice = Number(finalPrice) * (1 - dto.discountPercentage / 100);
    }

    // Calculate end date based on plan duration
    const startDate = new Date(dto.startDate);
    const endDate = new Date(startDate);
    if (plan.durationMonths) {
      endDate.setMonth(endDate.getMonth() + plan.durationMonths);
    } else if (plan.durationDays) {
      endDate.setDate(endDate.getDate() + plan.durationDays);
    } else {
      // Default to 1 month if no duration specified
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Create contract
    const contract = await this.prismaService.contract.create({
      data: {
        gymClientId: dto.gymClientId,
        gymMembershipPlanId: dto.gymMembershipPlanId,
        startDate,
        endDate,
        basePrice: plan.basePrice,
        customPrice: dto.customPrice || null,
        finalAmount: finalPrice,
        currency: context.organization.currency,
        discountPercentage: dto.discountPercentage || null,
        status: 'active',
        paymentFrequency: 'monthly',
        notes: dto.metadata?.notes || null,
        receiptIds: dto.receiptIds || [],
        createdByUserId: userId,
      },
      include: {
        gymClient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        gymMembershipPlan: {
          select: {
            id: true,
            name: true,
            durationMonths: true,
          },
        },
      },
    });

    return contract;
  }

  /**
   * Renew contract (CU-013)
   */
  async renewContract(
    context: IRequestContext,
    contractId: string,
    dto: RenewContractDto,
  ): Promise<Contract> {
    const userId = context.getUserId();
    // Find existing contract
    const existingContract = await this.prismaService.contract.findFirst({
      where: {
        id: contractId,
        gymClient: {
          gym: {
            OR: [
              { organization: { ownerUserId: userId } },
              { collaborators: { some: { userId, status: 'active' } } },
            ],
          },
        },
      },
      include: {
        gymMembershipPlan: true,
        gymClient: {
          include: {
            gym: {
              include: {
                organization: {
                  select: {
                    currency: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!existingContract) {
      throw new ResourceNotFoundException('Contrato', contractId);
    }

    // Check if contract can be renewed
    if (existingContract.status === 'cancelled') {
      throw new BusinessException('No se puede renovar un contrato cancelado');
    }

    // Set existing contract as completed
    await this.prismaService.contract.update({
      where: { id: contractId },
      data: {
        status: 'expired',
        updatedByUserId: userId,
      },
    });

    // Calculate new dates
    const startDate = dto.startDate
      ? new Date(dto.startDate)
      : new Date(existingContract.endDate || new Date());

    const endDate = new Date(startDate);
    if (existingContract.gymMembershipPlan.durationMonths) {
      endDate.setMonth(endDate.getMonth() + existingContract.gymMembershipPlan.durationMonths);
    } else if (existingContract.gymMembershipPlan.durationDays) {
      endDate.setDate(endDate.getDate() + existingContract.gymMembershipPlan.durationDays);
    } else {
      // Default to 1 month if no duration specified
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Calculate price
    let finalPrice = dto.customPrice || Number(existingContract.gymMembershipPlan.basePrice);
    if (dto.discountPercentage) {
      finalPrice = Number(finalPrice) * (1 - dto.discountPercentage / 100);
    }

    // Create new contract
    const newContract = await this.prismaService.contract.create({
      data: {
        gymClientId: existingContract.gymClientId,
        gymMembershipPlanId: existingContract.gymMembershipPlanId,
        startDate,
        endDate,
        basePrice: existingContract.gymMembershipPlan.basePrice,
        customPrice: dto.customPrice || null,
        finalAmount: finalPrice,
        currency: existingContract.gymClient.gym.organization.currency,
        discountPercentage: dto.discountPercentage || null,
        status: ContractStatus.ACTIVE,
        paymentFrequency: existingContract.paymentFrequency,
        notes: dto.metadata?.notes || existingContract.notes,
        createdByUserId: userId,
      },
      include: {
        gymClient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        gymMembershipPlan: {
          select: {
            id: true,
            name: true,
            durationMonths: true,
          },
        },
      },
    });

    return newContract;
  }

  /**
   * Freeze contract (CU-014)
   */
  async freezeContract(
    context: IRequestContext,
    contractId: string,
    dto: FreezeContractDto,
  ): Promise<Contract> {
    const userId = context.getUserId();
    const contract = await this.prismaService.contract.findFirst({
      where: {
        id: contractId,
        status: 'active',
        gymClient: {
          gym: {
            OR: [
              { organization: { ownerUserId: userId } },
              { collaborators: { some: { userId, status: 'active' } } },
            ],
          },
        },
      },
      include: {
        gymMembershipPlan: true,
      },
    });

    if (!contract) {
      throw new ResourceNotFoundException('Contrato', contractId);
    }

    // Validate freeze dates
    const freezeStart = new Date(dto.freezeStartDate);
    const freezeEnd = new Date(dto.freezeEndDate);

    if (freezeStart >= freezeEnd) {
      throw new BusinessException(
        'La fecha de fin del congelamiento debe ser posterior a la fecha de inicio',
      );
    }

    // Check if freeze period is within allowed limits
    const freezeDays = Math.ceil(
      (freezeEnd.getTime() - freezeStart.getTime()) / (1000 * 60 * 60 * 24),
    );
    const maxFreezeDays = 30; // Default max freeze days

    if (freezeDays > maxFreezeDays) {
      throw new BusinessException(
        `El período de congelamiento no puede exceder ${maxFreezeDays} días`,
      );
    }

    // Extend contract end date by freeze duration
    const newEndDate = new Date(contract.endDate!);
    newEndDate.setDate(newEndDate.getDate() + freezeDays);

    // Update contract
    const updated = await this.prismaService.contract.update({
      where: { id: contractId },
      data: {
        endDate: newEndDate,
        notes:
          (contract.notes || '') +
          `\n\nFreeze History:\n- Start: ${freezeStart.toISOString()}\n- End: ${freezeEnd.toISOString()}\n- Reason: ${dto.reason || 'N/A'}\n- Frozen at: ${new Date().toISOString()}`,
        updatedByUserId: userId,
      },
      include: {
        gymClient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        gymMembershipPlan: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Cancel contract
   */
  async cancelContract(
    context: IRequestContext,
    contractId: string,
    reason: string,
  ): Promise<Contract> {
    const userId = context.getUserId();
    const contract = await this.prismaService.contract.findFirst({
      where: {
        id: contractId,
        gymClient: {
          gym: {
            OR: [
              { organization: { ownerUserId: userId } },
              { collaborators: { some: { userId, status: 'active' } } },
            ],
          },
        },
      },
    });

    if (!contract) {
      throw new ResourceNotFoundException('Contrato', contractId);
    }

    if (contract.status === 'cancelled') {
      throw new BusinessException('El contrato ya está cancelado');
    }

    const updated = await this.prismaService.contract.update({
      where: { id: contractId },
      data: {
        status: 'cancelled',
        endDate: new Date(),
        notes:
          (contract.notes || '') +
          `\n\nCancellation:\n- Reason: ${reason}\n- Cancelled at: ${new Date().toISOString()}`,
        cancelledByUserId: userId,
        cancelledAt: new Date(),
        updatedByUserId: userId,
      },
    });

    return updated;
  }

  /**
   * Get contract by ID
   */
  async getContract(context: IRequestContext, contractId: string): Promise<Contract> {
    const userId = context.getUserId();
    const contract = await this.prismaService.contract.findFirst({
      where: {
        id: contractId,
        gymClient: {
          gym: {
            OR: [
              { organization: { ownerUserId: userId } },
              { collaborators: { some: { userId, status: 'active' } } },
            ],
          },
        },
      },
      include: {
        gymClient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            gym: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        gymMembershipPlan: true,
        createdBy: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!contract) {
      throw new ResourceNotFoundException('Contrato', contractId);
    }

    return contract;
  }

  /**
   * Get contracts for a gym with intelligent status updates
   */
  async getGymContracts(context: IRequestContext, status?: ContractStatus, limit = 20, offset = 0) {
    const gymId = context.getGymId();
    const userId = context.getUserId();

    if (!gymId) {
      throw new BusinessException('El contexto del gimnasio es requerido');
    }

    // Verify gym access - use cached gym from context if available
    if (!context.gym) {
      const hasAccess = await this.gymsService.hasGymAccess(gymId, userId);
      if (!hasAccess) {
        throw new ResourceNotFoundException('Gimnasio', gymId);
      }
    }

    // Run intelligent status updates before querying to ensure accuracy
    await this.updateExpiringSoonContracts();
    await this.updateExpiredContracts();

    // Build where clause more efficiently
    const where: Prisma.ContractWhereInput = {
      gymClient: {
        gymId,
        deletedAt: null, // Ensure we only get non-deleted clients
      },
      deletedAt: null, // Ensure we only get non-deleted contracts
    };

    if (status) {
      where.status = status;
    }

    // Execute queries
    const [contracts, total] = await Promise.all([
      this.prismaService.contract.findMany({
        where,
        include: {
          gymClient: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          gymMembershipPlan: {
            select: {
              id: true,
              name: true,
              basePrice: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prismaService.contract.count({ where }),
    ]);

    return {
      data: contracts,
      pagination: {
        total,
        limit,
        offset,
      },
    };
  }

  /**
   * Get client's contract history
   */
  async getClientContracts(context: IRequestContext, clientId: string) {
    const userId = context.getUserId();

    // Verify access through client
    // Create a RequestContext for the ClientsService call
    const requestContext = new RequestContext().forUser({ id: userId } as any);
    await this.clientsService.getClient(requestContext, clientId);

    const contracts = await this.prismaService.contract.findMany({
      where: { gymClientId: clientId },
      include: {
        gymMembershipPlan: {
          select: {
            id: true,
            name: true,
            basePrice: true,
            durationMonths: true,
          },
        },
        gymClient: {
          include: {
            gym: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    return contracts;
  }

  /**
   * Get contracts that need status updates for a specific gym
   * Useful for monitoring and debugging
   */
  async getContractsNeedingStatusUpdate(gymId?: string) {
    const now = new Date();
    const warningDate = new Date();
    warningDate.setDate(now.getDate() + CONTRACT_EXPIRATION_CONSTANTS.EXPIRING_SOON_DAYS);

    const baseWhere: Prisma.ContractWhereInput = {
      deletedAt: null,
    };

    if (gymId) {
      baseWhere.gymClient = {
        gymId,
      };
    }

    const [needingExpiringSoon, needingExpired] = await Promise.all([
      // Contracts that should be marked as expiring_soon
      this.prismaService.contract.findMany({
        where: {
          ...baseWhere,
          status: 'active',
          endDate: {
            lte: warningDate,
            gt: now,
          },
        },
        include: {
          gymClient: {
            select: { name: true, gymId: true },
          },
        },
      }),
      // Contracts that should be marked as expired
      this.prismaService.contract.findMany({
        where: {
          ...baseWhere,
          OR: [{ status: 'active' }, { status: 'expiring_soon' }],
          endDate: { lte: now },
        },
        include: {
          gymClient: {
            select: { name: true, gymId: true },
          },
        },
      }),
    ]);

    return {
      needingExpiringSoon,
      needingExpired,
      summary: {
        expiringSoonCount: needingExpiringSoon.length,
        expiredCount: needingExpired.length,
        totalNeedingUpdate: needingExpiringSoon.length + needingExpired.length,
      },
    };
  }

  /**
   * Check if a contract should be in expiring_soon status
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
   * Check if a contract should be expired
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
   * Update contracts to expiring_soon status
   * Called by the intelligent cron job
   */
  private async updateExpiringSoonContracts(): Promise<number> {
    const now = new Date();
    const warningDate = new Date();
    warningDate.setDate(now.getDate() + CONTRACT_EXPIRATION_CONSTANTS.EXPIRING_SOON_DAYS);

    const updated = await this.prismaService.contract.updateMany({
      where: {
        status: 'active',
        endDate: {
          lte: warningDate,
          gt: now, // Contract hasn't expired yet
        },
        deletedAt: null,
      },
      data: {
        status: ContractStatus.EXPIRING_SOON,
      },
    });

    if (updated.count > 0) {
      this.logger.log(`Updated ${updated.count} contracts to 'expiring_soon' status`);
    }

    return updated.count;
  }

  /**
   * Update contracts to expired status
   * Called by the intelligent cron job
   */
  private async updateExpiredContracts(): Promise<number> {
    const now = new Date();

    // Add grace period if configured
    const expirationThreshold = new Date(now);
    if (CONTRACT_EXPIRATION_CONSTANTS.GRACE_PERIOD_DAYS > 0) {
      expirationThreshold.setDate(now.getDate() - CONTRACT_EXPIRATION_CONSTANTS.GRACE_PERIOD_DAYS);
    }

    // Update contracts from both 'active' and 'expiring_soon' to 'expired'
    const expired = await this.prismaService.contract.updateMany({
      where: {
        OR: [{ status: 'active' }, { status: 'expiring_soon' }],
        endDate: { lte: expirationThreshold },
        deletedAt: null,
      },
      data: {
        status: 'expired',
      },
    });

    if (expired.count > 0) {
      this.logger.log(`Updated ${expired.count} contracts to 'expired' status`);
    }

    return expired.count;
  }

  /**
   * Get contract status statistics for monitoring
   */
  async getContractStatusStats() {
    const now = new Date();
    const warningDate = new Date();
    warningDate.setDate(now.getDate() + CONTRACT_EXPIRATION_CONSTANTS.EXPIRING_SOON_DAYS);

    const stats = await this.prismaService.contract.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
      where: {
        deletedAt: null,
      },
    });

    // Get additional stats for monitoring
    const expiringSoon = await this.prismaService.contract.count({
      where: {
        status: 'active',
        endDate: {
          lte: warningDate,
          gt: now,
        },
        deletedAt: null,
      },
    });

    const overdue = await this.prismaService.contract.count({
      where: {
        OR: [{ status: 'active' }, { status: 'expiring_soon' }],
        endDate: { lte: now },
        deletedAt: null,
      },
    });

    return {
      statusBreakdown: stats.reduce(
        (acc, stat) => {
          acc[stat.status] = stat._count.id;
          return acc;
        },
        {} as Record<ContractStatus, number>,
      ),
      pendingUpdates: {
        expiringSoon,
        overdue,
      },
    };
  }

  /**
   * Intelligent contract status update cron job
   * Runs every 6 hours to maintain accurate contract statuses
   */
  @Cron(CONTRACT_EXPIRATION_CONSTANTS.CRON_SCHEDULE)
  async updateContractStatuses() {
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
      // if (this.logger.isLevelEnabled('debug')) {
      //   const stats = await this.getContractStatusStats();
      //   this.logger.debug('Current contract status stats:', stats);
      // }
    } catch (error) {
      this.logger.error('Error updating contract statuses', error.stack);
      throw error;
    }
  }

  /**
   * Manual trigger for contract status updates
   * Can be called by administrators or other services
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
