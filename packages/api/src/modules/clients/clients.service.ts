import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { GymsService } from '../gyms/gyms.service';
import { PaginationService } from '../../common/services/pagination.service';
import { CreateClientDto, UpdateClientDto, SearchClientsDto } from './dto';
import { BusinessException, ResourceNotFoundException } from '../../common/exceptions';
import { Prisma } from '@prisma/client';
import { RequestContext } from '../../common/services/request-context.service';

@Injectable()
export class ClientsService {
  constructor(
    private prismaService: PrismaService,
    private organizationsService: OrganizationsService,
    private gymsService: GymsService,
    private paginationService: PaginationService,
  ) {}

  /**
   * Create a new client (CU-006)
   */
  async createClient(ctx: RequestContext, dto: CreateClientDto): Promise<any> {
    const gymId = ctx.getGymId()!;
    const userId = ctx.getUserId()!;

    // Check if gym can add more clients
    const canAdd = await this.organizationsService.canAddClient(gymId);
    if (!canAdd) {
      throw new BusinessException('Límite de clientes alcanzado para este plan de suscripción');
    }

    // Verify gym access
    const hasAccess = await this.gymsService.hasGymAccess(gymId, userId);
    if (!hasAccess) {
      throw new ResourceNotFoundException('Gym', gymId);
    }

    // Check if document already exists in this gym (only if both document type and value are provided)
    if (dto.documentType && dto.documentValue) {
      const existingClient = await this.prismaService.gymClient.findFirst({
        where: {
          documentType: dto.documentType,
          documentValue: dto.documentValue,
          gymId,
        },
      });

      if (existingClient) {
        throw new BusinessException(
          `Ya existe un cliente con este documento (${dto.documentType}: ${dto.documentValue}) en este gimnasio`,
        );
      }
    }

    // Generate client number
    const clientCount = await this.prismaService.gymClient.count({
      where: { gymId },
    });
    const clientNumber = `C${Date.now()}-${clientCount + 1}`;

    // Create client - filter out fields that don't exist in schema
    const {
      address,
      city,
      state,
      postalCode,
      gender,
      maritalStatus,
      occupation,
      customData,
      ...validClientData
    } = dto;

    const client = await this.prismaService.gymClient.create({
      data: {
        ...validClientData,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        documentValue: dto.documentValue || undefined,
        documentType: dto.documentType || undefined,
        gymId,
        clientNumber,
        name: dto.name.trim(),
        status: 'active',
        // Registration date is handled by createdAt
        createdByUserId: userId,
      },
      include: {
        gym: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return client;
  }

  /**
   * Update client information (CU-007)
   */
  async updateClient(ctx: RequestContext, clientId: string, dto: UpdateClientDto): Promise<any> {
    const userId = ctx.getUserId()!;

    // Verify client exists and user has access
    const client = await this.prismaService.gymClient.findFirst({
      where: {
        id: clientId,
        gym: {
          OR: [
            { organization: { ownerUserId: userId } },
            { collaborators: { some: { userId, status: 'active' } } },
          ],
        },
      },
    });

    if (!client) {
      throw new ResourceNotFoundException('Client', clientId);
    }

    // If document is being updated, check uniqueness within gym
    if (
      dto.documentType &&
      dto.documentValue &&
      (dto.documentType !== client.documentType || dto.documentValue !== client.documentValue)
    ) {
      const documentExists = await this.prismaService.gymClient.findFirst({
        where: {
          documentType: dto.documentType,
          documentValue: dto.documentValue,
          gymId: client.gymId,
          id: { not: clientId },
        },
      });

      if (documentExists) {
        throw new BusinessException(
          `Ya existe un cliente con este documento (${dto.documentType}: ${dto.documentValue}) en este gimnasio`,
        );
      }
    }

    // Update client - filter out fields that don't exist in schema
    const {
      address,
      city,
      state,
      postalCode,
      gender,
      maritalStatus,
      occupation,
      customData,
      ...validClientData
    } = dto;

    const updated = await this.prismaService.gymClient.update({
      where: { id: clientId },
      data: {
        ...validClientData,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        documentValue: dto.documentValue || undefined,
        documentType: dto.documentType || undefined,
        updatedByUserId: userId,
      },
      include: {
        gym: {
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
   * Get client by ID
   */
  async getClient(ctx: RequestContext, clientId: string): Promise<any> {
    const userId = ctx.getUserId()!;

    const client = await this.prismaService.gymClient.findFirst({
      where: {
        id: clientId,
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
        contracts: {
          where: { status: 'active' },
          include: {
            gymMembershipPlan: true,
          },
        },
        evaluations: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        checkIns: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            contracts: true,
            evaluations: true,
            checkIns: true,
          },
        },
      },
    });

    if (!client) {
      throw new ResourceNotFoundException('Client', clientId);
    }

    return client;
  }

  /**
   * Search clients in a gym
   */
  async searchClients(ctx: RequestContext, dto: SearchClientsDto) {
    const gymId = ctx.getGymId()!;
    const userId = ctx.getUserId()!;

    // Verify gym access
    const hasAccess = await this.gymsService.hasGymAccess(gymId, userId);
    if (!hasAccess) {
      throw new ResourceNotFoundException('Gym', gymId);
    }

    const where: Prisma.GymClientWhereInput = {
      gymId,
    };

    // Apply search filter
    if (dto.search) {
      where.OR = [
        { name: { contains: dto.search, mode: 'insensitive' } },
        { email: { contains: dto.search, mode: 'insensitive' } },
        { phone: { contains: dto.search, mode: 'insensitive' } },
        { documentValue: { contains: dto.search, mode: 'insensitive' } },
        { clientNumber: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    // Apply specific filters
    if (dto.clientNumber) {
      where.clientNumber = dto.clientNumber;
    }

    if (dto.documentId) {
      where.documentValue = dto.documentId;
    }

    // Apply active filter
    if (dto.activeOnly) {
      where.status = 'active';
    }

    // Get total count
    const total = await this.prismaService.gymClient.count({ where });

    // Create pagination params
    const paginationParams = this.paginationService.createPaginationParams({
      page: dto.page,
      limit: dto.limit,
      sortBy: dto.sortBy,
      sortOrder: dto.sortOrder,
    });

    // Determine what to include based on request
    const includeOptions: any = {
      _count: {
        select: {
          evaluations: true,
          checkIns: true,
        },
      },
    };

    // Include contract status if requested
    if (dto.includeContractStatus) {
      includeOptions.contracts = {
        where: {
          status: 'active',
          startDate: { lte: new Date() },
          endDate: { gte: new Date() },
        },
        include: {
          gymMembershipPlan: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { endDate: 'desc' },
        take: 1,
      };
    }

    console.log('where', {
      where,
      dto,
    });

    // Get clients with pagination
    const clients = await this.prismaService.gymClient.findMany({
      where,
      include: includeOptions,
      orderBy: paginationParams.orderBy || [
        { createdAt: 'desc' }, // Most recent clients first
      ],
      ...paginationParams,
    });

    // Return paginated response
    return this.paginationService.paginate(clients, total, {
      page: dto.page,
      limit: dto.limit,
    });
  }

  /**
   * Toggle client status (activate/deactivate)
   */
  async toggleClientStatus(ctx: RequestContext, clientId: string): Promise<any> {
    const userId = ctx.getUserId()!;

    const client = await this.prismaService.gymClient.findFirst({
      where: {
        id: clientId,
        gym: {
          OR: [
            { organization: { ownerUserId: userId } },
            { collaborators: { some: { userId, status: 'active' } } },
          ],
        },
      },
      include: {
        contracts: {
          where: { status: 'active' },
        },
      },
    });

    if (!client) {
      throw new ResourceNotFoundException('Client', clientId);
    }

    const newStatus = client.status === 'active' ? 'inactive' : 'active';

    // If deactivating, check for active contracts
    if (newStatus === 'inactive') {
      const activeContractsCount = client.contracts.length;

      if (activeContractsCount > 0) {
        throw new BusinessException(
          'CANNOT_DEACTIVATE_CLIENT_WITH_ACTIVE_CONTRACTS',
          `Client cannot be deactivated because they have ${activeContractsCount} active contract(s). Please cancel or complete the contracts first.`,
        );
      }
    }

    return this.prismaService.gymClient.update({
      where: { id: clientId },
      data: {
        status: newStatus,
        updatedByUserId: userId,
      },
    });
  }

  /**
   * Get client statistics
   */
  async getClientStats(ctx: RequestContext, clientId: string) {
    // Use a single transaction for ALL database operations
    const result = await this.prismaService.$transaction(async (tx) => {
      // Get client with related data
      const client = await tx.gymClient.findUnique({
        where: {
          id: clientId,
          gymId: ctx.gym.id,
          deletedAt: null,
        },
        include: {
          checkIns: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          evaluations: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!client) {
        throw new ResourceNotFoundException('Client not found');
      }

      // Perform all counts and queries in parallel within the transaction
      const [
        totalCheckIns,
        monthlyCheckIns,
        totalEvaluations,
        activeContracts,
        membershipHistory,
        totalSpentData,
      ] = await Promise.all([
        // Total check-ins
        tx.checkIn.count({
          where: { gymClientId: clientId },
        }),
        // Monthly check-ins (current month)
        tx.checkIn.count({
          where: {
            gymClientId: clientId,
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),
        // Total evaluations
        tx.evaluation.count({
          where: { gymClientId: clientId },
        }),
        // Active contracts
        tx.contract.count({
          where: { gymClientId: clientId, status: 'active' },
        }),
        // Membership history
        tx.contract.findMany({
          where: { gymClientId: clientId },
          include: {
            gymMembershipPlan: {
              select: {
                id: true,
                name: true,
                basePrice: true,
              },
            },
          },
          orderBy: { startDate: 'desc' },
          take: 5,
        }),
        // Total spent - aggregate sum
        tx.contract.aggregate({
          where: { gymClientId: clientId },
          _sum: {
            finalAmount: true,
          },
        }),
      ]);

      const totalSpent = totalSpentData._sum.finalAmount || 0;

      return {
        client,
        totalCheckIns,
        monthlyCheckIns,
        totalEvaluations,
        activeContracts,
        membershipHistory,
        totalSpent,
      };
    });

    const {
      client,
      totalCheckIns,
      monthlyCheckIns,
      totalEvaluations,
      activeContracts,
      membershipHistory,
      totalSpent,
    } = result;

    return {
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        status: client.status,
        registrationDate: client.createdAt,
      },
      activity: {
        totalCheckIns,
        monthlyCheckIns,
        lastCheckIn: client.checkIns[0]?.createdAt || null,
      },
      evaluations: {
        total: totalEvaluations,
        lastEvaluation: client.evaluations[0]?.createdAt || null,
      },
      contracts: {
        active: activeContracts,
        totalSpent,
      },
      membershipHistory,
    };
  }

  /**
   * Calculate total amount spent by client
   */
  private async _calculateTotalSpent(clientId: string): Promise<number> {
    const contracts = await this.prismaService.contract.findMany({
      where: { gymClientId: clientId },
      include: {
        gymMembershipPlan: true,
      },
    });

    return contracts.reduce((total, contract) => {
      const months = this.getMonthsBetweenDates(contract.startDate, contract.endDate || new Date());
      return total + Number(contract.gymMembershipPlan.basePrice) * months;
    }, 0);
  }

  /**
   * Get number of months between two dates
   */
  private getMonthsBetweenDates(start: Date, end: Date): number {
    const months =
      (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    return Math.max(1, months);
  }
}
