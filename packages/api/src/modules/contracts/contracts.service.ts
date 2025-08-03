import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../core/database/prisma.service';
import { GymsService } from '../gyms/gyms.service';
import { ClientsService } from '../clients/clients.service';
import { CreateContractDto, RenewContractDto, FreezeContractDto } from './dto';
import { BusinessException, ResourceNotFoundException } from '../../common/exceptions';
import { Contract, Prisma } from '@prisma/client';
import { ContractStatus } from '@gymspace/shared';

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
  async createContract(gymId: string, dto: CreateContractDto, userId: string): Promise<Contract> {
    // Verify gym access
    const hasAccess = await this.gymsService.hasGymAccess(gymId, userId);
    if (!hasAccess) {
      throw new ResourceNotFoundException('Gym', gymId);
    }

    // Verify client belongs to this gym
    const client = await this.prismaService.gymClient.findFirst({
      where: {
        id: dto.gymClientId,
        gymId,
      },
    });

    if (!client) {
      throw new ResourceNotFoundException('Client', dto.gymClientId);
    }

    // Check if client has active contract
    const activeContract = await this.prismaService.contract.findFirst({
      where: {
        gymClientId: dto.gymClientId,
        status: 'active',
      },
    });

    if (activeContract) {
      throw new BusinessException('Client already has an active contract');
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
      throw new ResourceNotFoundException('MembershipPlan', dto.gymMembershipPlanId);
    }

    // Calculate price
    let finalPrice = dto.customPrice || Number(plan.basePrice);
    if (dto.discountPercentage) {
      finalPrice = Number(finalPrice) * (1 - dto.discountPercentage / 100);
    }

    // Calculate end date based on plan duration
    const startDate = new Date(dto.startDate);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + plan.durationMonths);

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
        currency: plan.currency,
        discountPercentage: dto.discountPercentage || null,
        status: 'active',
        paymentFrequency: 'monthly',
        notes: dto.metadata?.notes || null,
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
    contractId: string,
    dto: RenewContractDto,
    userId: string,
  ): Promise<Contract> {
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
      },
    });

    if (!existingContract) {
      throw new ResourceNotFoundException('Contract', contractId);
    }

    // Check if contract can be renewed
    if (existingContract.status === 'cancelled') {
      throw new BusinessException('Cannot renew a cancelled contract');
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
    endDate.setMonth(endDate.getMonth() + existingContract.gymMembershipPlan.durationMonths);

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
        currency: existingContract.currency,
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
    contractId: string,
    dto: FreezeContractDto,
    userId: string,
  ): Promise<Contract> {
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
      throw new ResourceNotFoundException('Contract', contractId);
    }

    // Validate freeze dates
    const freezeStart = new Date(dto.freezeStartDate);
    const freezeEnd = new Date(dto.freezeEndDate);

    if (freezeStart >= freezeEnd) {
      throw new BusinessException('Freeze end date must be after start date');
    }

    // Check if freeze period is within allowed limits
    const freezeDays = Math.ceil(
      (freezeEnd.getTime() - freezeStart.getTime()) / (1000 * 60 * 60 * 24),
    );
    const maxFreezeDays = 30; // Default max freeze days

    if (freezeDays > maxFreezeDays) {
      throw new BusinessException(`Freeze period cannot exceed ${maxFreezeDays} days`);
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
  async cancelContract(contractId: string, reason: string, userId: string): Promise<Contract> {
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
      throw new ResourceNotFoundException('Contract', contractId);
    }

    if (contract.status === 'cancelled') {
      throw new BusinessException('Contract is already cancelled');
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
  async getContract(contractId: string, userId: string): Promise<Contract> {
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
      throw new ResourceNotFoundException('Contract', contractId);
    }

    return contract;
  }

  /**
   * Get contracts for a gym
   */
  async getGymContracts(
    gymId: string,
    userId: string,
    status?: ContractStatus,
    limit = 20,
    offset = 0,
  ) {
    // Verify gym access
    const hasAccess = await this.gymsService.hasGymAccess(gymId, userId);
    if (!hasAccess) {
      throw new ResourceNotFoundException('Gym', gymId);
    }

    const where: Prisma.ContractWhereInput = {
      gymClient: {
        gymId,
      },
    };
    if (status) {
      where.status = status;
    }

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
      contracts,
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
  async getClientContracts(clientId: string, userId: string) {
    // Verify access through client
    await this.clientsService.getClient(clientId, userId);

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
