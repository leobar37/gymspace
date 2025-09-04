import { IRequestContext } from '@gymspace/shared';
import { Injectable, Logger } from '@nestjs/common';
import { Contract, Prisma } from '@prisma/client';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import ms from 'ms';
import { BusinessException, ResourceNotFoundException } from '../../common/exceptions';
import { PaginationService } from '../../common/services/pagination.service';
import { RequestContext } from '../../common/services/request-context.service';
import { PrismaService } from '../../core/database/prisma.service';
import { ClientsService } from '../clients/clients.service';
import { GymsService } from '../gyms/gyms.service';
import { GymMembershipPlansService } from '../membership-plans/membership-plans.service';
import { CreateContractDto, FreezeContractDto, GetContractsDto, RenewContractDto } from './dto';
import { ContractStatusHelper } from './helpers/contract-status.helper';
import { ContractBaseService } from './helpers/contract.base';

// Extend dayjs with plugins
dayjs.extend(isSameOrAfter);

@Injectable()
export class ContractsService {
  private readonly logger = new Logger(ContractsService.name);

  constructor(
    private prismaService: PrismaService,
    private gymsService: GymsService,
    private clientsService: ClientsService,
    private gymMembershipPlansService: GymMembershipPlansService,
    private paginationService: PaginationService,
    private contractStatusHelper: ContractStatusHelper,
    private contractBaseService: ContractBaseService,
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
    await this.clientsService.validateClientBelongsToGym(context, dto.gymClientId);

    // Check if client has active contract
    await this.clientsService.checkActiveContract(context, dto.gymClientId);

    // Run intelligent contract status update to ensure accurate status

    // Verify membership plan belongs to this gym and is active
    const plan = await this.gymMembershipPlansService.validatePlanForContract(
      context,
      dto.gymMembershipPlanId,
    );

    // Calculate price
    let finalPrice = dto.customPrice || Number(plan.basePrice);
    if (dto.discountPercentage) {
      finalPrice = Number(finalPrice) * (1 - dto.discountPercentage / 100);
    }

    // Calculate end date based on plan duration
    const startDate = new Date(dto.startDate);
    const endDate = this.gymMembershipPlansService.calculateEndDate(startDate, plan);

    // Create contract
    const contract = await this.prismaService.contract.create({
      data: {
        gymClientId: dto.gymClientId,
        gymMembershipPlanId: dto.gymMembershipPlanId,
        paymentMethodId: dto.paymentMethodId,
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
        renewals: {
          where: {
            status: 'for_renew'
          }
        },
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

    // Check if there's already a renewal in progress
    if (existingContract.renewals && existingContract.renewals.length > 0) {
      throw new BusinessException('Ya existe una renovación en curso para este contrato');
    }

    // Calculate new dates
    const startDate = dto.startDate
      ? new Date(dto.startDate)
      : dto.applyAtEndOfContract
      ? new Date(existingContract.endDate || new Date())
      : new Date(); // Start immediately if not specified

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
    let discountAmount = null;
    
    if (dto.discountPercentage) {
      discountAmount = Number(finalPrice) * (dto.discountPercentage / 100);
      finalPrice = Number(finalPrice) - discountAmount;
    }

    // Create new contract with for_renew status and parent reference
    const newContract = await this.prismaService.contract.create({
      data: {
        gymClientId: existingContract.gymClientId,
        gymMembershipPlanId: existingContract.gymMembershipPlanId,
        paymentMethodId: dto.paymentMethodId || existingContract.paymentMethodId,
        parentId: contractId, // Reference to parent contract
        startDate,
        endDate,
        basePrice: existingContract.gymMembershipPlan.basePrice,
        customPrice: dto.customPrice || null,
        finalAmount: finalPrice,
        currency: existingContract.gymClient.gym.organization.currency,
        discountPercentage: dto.discountPercentage || null,
        discountAmount: discountAmount || null,
        status: 'for_renew', // New status for renewal contracts
        paymentFrequency: existingContract.paymentFrequency,
        notes: dto.notes || null,
        contractDocumentId: dto.contractDocumentId || null,
        receiptIds: dto.receiptIds || [],
        createdByUserId: userId,
        gymId: existingContract.gymId,
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
   * Handles freezing for both regular contracts and their renewals
   */
  async freezeContract(
    context: IRequestContext,
    contractId: string,
    dto: FreezeContractDto,
  ): Promise<Contract> {
    const userId = context.getUserId();
    const gymId = context.getGymId();

    // Find contract with renewals directly using Prisma
    const contract = await this.prismaService.contract.findFirst({
      where: {
        id: contractId,
        gymClient: {
          gymId,
          deletedAt: null,
        },
        deletedAt: null,
      },
      include: {
        gymMembershipPlan: true,
        renewals: {
          where: {
            status: 'for_renew',
          },
        },
      },
    });

    if (!contract) {
      throw new ResourceNotFoundException('Contrato', contractId);
    }

    // Contract must be active to freeze
    if (contract.status !== 'active') {
      throw new BusinessException('Solo se pueden congelar contratos activos');
    }

    // Validate freeze dates using dayjs
    const freezeStart = dayjs(dto.freezeStartDate);
    const freezeEnd = dayjs(dto.freezeEndDate);
    const now = dayjs();

    if (!freezeStart.isValid() || !freezeEnd.isValid()) {
      throw new BusinessException('Las fechas de congelamiento no son válidas');
    }

    if (freezeStart.isSameOrAfter(freezeEnd)) {
      throw new BusinessException(
        'La fecha de fin del congelamiento debe ser posterior a la fecha de inicio',
      );
    }

    // Calculate freeze duration in milliseconds
    const freezeDurationMs = freezeEnd.diff(freezeStart);
    const freezeDays = Math.ceil(freezeDurationMs / ms('1d'));

    // TODO: add this to gym configurations
    const maxFreezeDurationMs = ms('30d'); // Default max freeze period
    const maxFreezeDays = 30;

    if (freezeDurationMs > maxFreezeDurationMs) {
      throw new BusinessException(
        `El período de congelamiento no puede exceder ${maxFreezeDays} días`,
      );
    }

    // Extend contract end date by freeze duration
    const currentEndDate = dayjs(contract.endDate);
    const newEndDate = currentEndDate.add(freezeDurationMs, 'milliseconds');

    // Create freeze history record
    const freezeHistory = [
      'Freeze History:',
      `- Start: ${freezeStart.format('YYYY-MM-DD HH:mm:ss')}`,
      `- End: ${freezeEnd.format('YYYY-MM-DD HH:mm:ss')}`,
      `- Duration: ${freezeDays} days`,
      `- Reason: ${dto.reason || 'N/A'}`,
      `- Frozen at: ${now.format('YYYY-MM-DD HH:mm:ss')}`,
      `- Extended end date from: ${currentEndDate.format('YYYY-MM-DD')} to: ${newEndDate.format('YYYY-MM-DD')}`,
    ].join('\n');

    // Check if there are renewals that need to be adjusted
    const hasRenewals = contract.renewals && contract.renewals.length > 0;
    
    if (hasRenewals) {
      // If there are renewals, we need to adjust their start dates
      const renewal = contract.renewals[0];
      
      // Only adjust if renewal is set to start at contract end
      const renewalStartDate = dayjs(renewal.startDate);
      const contractEndDate = dayjs(contract.endDate);
      
      // Check if renewal starts at or near contract end (within 1 day tolerance)
      const startsAtContractEnd = Math.abs(renewalStartDate.diff(contractEndDate, 'days')) <= 1;
      
      if (startsAtContractEnd) {
        // Update renewal start date to match new contract end date
        const newRenewalStartDate = newEndDate.toDate();
        const renewalDuration = dayjs(renewal.endDate).diff(renewalStartDate, 'milliseconds');
        const newRenewalEndDate = newEndDate.add(renewalDuration, 'milliseconds').toDate();
        
        await this.prismaService.contract.update({
          where: { id: renewal.id },
          data: {
            startDate: newRenewalStartDate,
            endDate: newRenewalEndDate,
            notes: renewal.notes 
              ? `${renewal.notes}\n\nAdjusted due to parent contract freeze:\n- New start: ${dayjs(newRenewalStartDate).format('YYYY-MM-DD')}\n- New end: ${dayjs(newRenewalEndDate).format('YYYY-MM-DD')}`
              : `Adjusted due to parent contract freeze:\n- New start: ${dayjs(newRenewalStartDate).format('YYYY-MM-DD')}\n- New end: ${dayjs(newRenewalEndDate).format('YYYY-MM-DD')}`,
            updatedByUserId: userId,
          },
        });
        
        this.logger.log(
          `Renewal contract ${renewal.id} adjusted: start date moved from ${renewalStartDate.format()} to ${dayjs(newRenewalStartDate).format()}`,
        );
      }
    }

    // Update main contract
    const updated = await this.prismaService.contract.update({
      where: { id: contractId },
      data: {
        endDate: newEndDate.toDate(),
        notes: contract.notes ? `${contract.notes}\n\n${freezeHistory}` : freezeHistory,
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
        renewals: {
          where: {
            status: 'for_renew',
          },
          select: {
            id: true,
            startDate: true,
            endDate: true,
            status: true,
          },
        },
      },
    });

    this.logger.log(
      `Contract ${contractId} frozen from ${freezeStart.format()} to ${freezeEnd.format()}, extending end date by ${freezeDays} days${hasRenewals ? ' (renewal adjusted)' : ''}`,
    );

    return updated;
  }

  /**
   * Cancel contract
   * Also cancels any pending renewals
   */
  async cancelContract(
    context: IRequestContext,
    contractId: string,
    reason: string,
  ): Promise<Contract> {
    const userId = context.getUserId();
    const gymId = context.getGymId();
    
    // Find contract with renewals
    const contract = await this.prismaService.contract.findFirst({
      where: {
        id: contractId,
        gymClient: {
          gymId,
          deletedAt: null,
        },
        deletedAt: null,
      },
      include: {
        renewals: {
          where: {
            status: 'for_renew',
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

    // Cancel any pending renewals
    if (contract.renewals && contract.renewals.length > 0) {
      for (const renewal of contract.renewals) {
        await this.prismaService.contract.update({
          where: { id: renewal.id },
          data: {
            status: 'cancelled',
            notes: renewal.notes 
              ? `${renewal.notes}\n\nCancelled due to parent contract cancellation`
              : 'Cancelled due to parent contract cancellation',
            cancelledByUserId: userId,
            cancelledAt: new Date(),
            updatedByUserId: userId,
          },
        });
        
        this.logger.log(`Renewal contract ${renewal.id} cancelled due to parent contract cancellation`);
      }
    }

    // Update main contract
    const updated = await this.prismaService.contract.update({
      where: { id: contractId },
      data: {
        status: 'cancelled',
        endDate: new Date(),
        notes:
          (contract.notes || '') +
          `\n\nCancellation:\n- Reason: ${reason}\n- Cancelled at: ${new Date().toISOString()}${
            contract.renewals && contract.renewals.length > 0 
              ? `\n- Renewals cancelled: ${contract.renewals.length}` 
              : ''
          }`,
        cancelledByUserId: userId,
        cancelledAt: new Date(),
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
        paymentMethod: true,
        renewals: {
          where: {
            status: 'for_renew'
          },
          include: {
            gymMembershipPlan: true,
            paymentMethod: true,
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
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
  async getGymContracts(context: IRequestContext, query: GetContractsDto) {
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

    // Build where clause
    const where: Prisma.ContractWhereInput = {
      gymClient: {
        gymId,
        deletedAt: null,
      },
      deletedAt: null,
      // Exclude contracts that are for renewal
      status: {
        not: 'for_renew',
      },
    };

    // Apply status filter (override the NOT filter if a specific status is requested)
    if (query.status) {
      where.status = query.status;
    }

    // Apply client name filter
    if (query.clientName) {
      where.gymClient = {
        ...(where.gymClient as any),
        name: {
          contains: query.clientName,
          mode: 'insensitive' as const,
        },
      };
    }

    // Apply client ID filter
    if (query.clientId) {
      where.gymClientId = query.clientId;
    }

    // Apply date range filters for contract start date
    if (query.startDateFrom || query.startDateTo) {
      where.startDate = {};
      if (query.startDateFrom) {
        where.startDate.gte = new Date(query.startDateFrom);
      }
      if (query.startDateTo) {
        where.startDate.lte = new Date(query.startDateTo);
      }
    }

    // Apply date range filters for contract end date
    if (query.endDateFrom || query.endDateTo) {
      where.endDate = {};
      if (query.endDateFrom) {
        where.endDate.gte = new Date(query.endDateFrom);
      }
      if (query.endDateTo) {
        where.endDate.lte = new Date(query.endDateTo);
      }
    }

    // Build order by
    const orderBy: any = query.sortBy
      ? { [query.sortBy]: query.sortOrder || 'desc' }
      : { createdAt: 'desc' as const };

    // Build include
    const include = {
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
    };

    // Create pagination params
    const paginationParams = this.paginationService.createPaginationParams({
      page: query.page,
      limit: query.limit,
    });

    // Execute queries
    const [contracts, total] = await Promise.all([
      this.prismaService.contract.findMany({
        where,
        include,
        orderBy,
        skip: paginationParams.skip,
        take: paginationParams.take,
      }),
      this.prismaService.contract.count({ where }),
    ]);

    // Use pagination service to format response
    return this.paginationService.paginate(contracts, total, {
      page: query.page || 1,
      limit: query.limit || 20,
    });
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
   * Delegate to helper - Get contracts that need status update
   */
  async getContractsNeedingStatusUpdate(gymId?: string) {
    return this.contractStatusHelper.getContractsNeedingStatusUpdate(gymId);
  }

  /**
   * Delegate to helper - Check if a contract is expiring soon
   */
  isContractExpiringSoon(contract: { status: string; endDate: Date | null }): boolean {
    return this.contractStatusHelper.isContractExpiringSoon(contract);
  }

  /**
   * Delegate to helper - Check if a contract is expired
   */
  isContractExpired(contract: { status: string; endDate: Date | null }): boolean {
    return this.contractStatusHelper.isContractExpired(contract);
  }

  /**
   * Delegate to helper - Get contract status statistics
   */
  async getContractStatusStats(gymId?: string) {
    return this.contractStatusHelper.getContractStatusStats(gymId);
  }

  /**
   * Delegate to helper - Manual trigger for status update
   */
  async triggerContractStatusUpdate() {
    return this.contractStatusHelper.triggerContractStatusUpdate();
  }
}
