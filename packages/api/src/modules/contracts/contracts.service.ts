import { ContractStatus, IRequestContext } from '@gymspace/shared';
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Contract, Prisma } from '@prisma/client';
import { BusinessException, ResourceNotFoundException } from '../../common/exceptions';
import { RequestContext } from '../../common/services/request-context.service';
import { PrismaService } from '../../core/database/prisma.service';
import { ClientsService } from '../clients/clients.service';
import { GymsService } from '../gyms/gyms.service';
import { CreateContractDto, FreezeContractDto, RenewContractDto } from './dto';

@Injectable()
export class ContractsService {
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
    // Consider both status and dates
    const now = new Date();
    const existingContracts = await this.prismaService.contract.findMany({
      where: {
        gymClientId: dto.gymClientId,
        deletedAt: null, // Explicitly check for non-deleted contracts
        OR: [
          // Active contracts
          { status: 'active' },
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
      } else if (activeContract.status === 'pending') {
        throw new BusinessException(
          'El cliente tiene un contrato pendiente que aún no ha iniciado',
        );
      }
    }

    // Also check if there are any expired contracts that need to be updated
    const expiredContracts = await this.prismaService.contract.updateMany({
      where: {
        gymClientId: dto.gymClientId,
        status: 'active',
        endDate: { lt: now },
        deletedAt: null,
      },
      data: {
        status: 'expired',
      },
    });

    if (expiredContracts.count > 0) {
      console.log(
        `Updated ${expiredContracts.count} expired contracts for client ${dto.gymClientId}`,
      );
    }

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
        status: 'active',
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
   * Get contracts for a gym
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
   * Update expired contracts - can be called manually or by cron
   */
  async updateExpiredContracts() {
    const now = new Date();

    // Update expired contracts
    const expired = await this.prismaService.contract.updateMany({
      where: {
        status: 'active',
        endDate: { lte: now },
        deletedAt: null,
      },
      data: {
        status: 'expired',
      },
    });

    if (expired.count > 0) {
      console.log(`Updated ${expired.count} expired contracts to 'expired' status`);
    }

    return expired.count;
  }

  /**
   * Check and update expired/frozen contracts (scheduled task)
   */
  @Cron('0 0 * * *') // Daily at midnight
  async updateContractStatuses() {
    const now = new Date();

    // Update expired contracts
    const expired = await this.prismaService.contract.updateMany({
      where: {
        status: 'active',
        endDate: { lte: now },
      },
      data: {
        status: 'expired',
      },
    });

    console.log(`Updated ${expired.count} expired contracts`);
  }
}
