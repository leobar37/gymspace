import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { GymsService } from '../gyms/gyms.service';
import { PaginationService } from '../../common/services/pagination.service';
import { CreateClientDto, UpdateClientDto, SearchClientsDto } from './dto';
import { BusinessException, ResourceNotFoundException } from '../../common/exceptions';
import { Prisma } from '@prisma/client';

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
  async createClient(gymId: string, dto: CreateClientDto, userId: string): Promise<any> {
    // Check if gym can add more clients
    console.log('pas here 1');
    const canAdd = await this.organizationsService.canAddClient(gymId);
    if (!canAdd) {
      throw new BusinessException('Client limit reached for this subscription plan');
    }

    console.log('pas here 2');
    // Verify gym access
    const hasAccess = await this.gymsService.hasGymAccess(gymId, userId);
    if (!hasAccess) {
      throw new ResourceNotFoundException('Gym', gymId);
    }

    console.log('pas here');

    // Check if email already exists in this gym
    const existingClient = await this.prismaService.gymClient.findFirst({
      where: {
        email: dto.email,
        gymId,
      },
    });

    if (existingClient) {
      throw new BusinessException('A client with this email already exists in this gym');
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
  async updateClient(clientId: string, dto: UpdateClientDto, userId: string): Promise<any> {
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

    // If email is being updated, check uniqueness within gym
    if (dto.email && dto.email !== client.email) {
      const emailExists = await this.prismaService.gymClient.findFirst({
        where: {
          email: dto.email,
          gymId: client.gymId,
          id: { not: clientId },
        },
      });

      if (emailExists) {
        throw new BusinessException('A client with this email already exists in this gym');
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
  async getClient(clientId: string, userId: string): Promise<any> {
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
  async searchClients(gymId: string, dto: SearchClientsDto, userId: string) {
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
      ];
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

    // Get clients with pagination
    const clients = await this.prismaService.gymClient.findMany({
      where,
      include: {
        contracts: {
          where: { status: 'active' },
          include: {
            gymMembershipPlan: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            evaluations: true,
            checkIns: true,
          },
        },
      },
      orderBy: paginationParams.orderBy || [
        { status: 'asc' }, // Active clients first
        { name: 'asc' },
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
  async toggleClientStatus(clientId: string, userId: string): Promise<any> {
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

    const newStatus = client.status === 'active' ? 'inactive' : 'active';

    // If deactivating, cancel active contracts
    if (newStatus === 'inactive') {
      await this.prismaService.contract.updateMany({
        where: {
          gymClientId: clientId,
          status: 'active',
        },
        data: {
          status: 'cancelled',
          endDate: new Date(),
          updatedByUserId: userId,
        },
      });
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
  async getClientStats(clientId: string, userId: string) {
    const client = await this.getClient(clientId, userId);

    const [totalCheckIns, monthlyCheckIns, totalEvaluations, activeContracts, totalSpent] =
      await Promise.all([
        // Total check-ins
        this.prismaService.checkIn.count({
          where: { gymClientId: clientId },
        }),
        // Monthly check-ins (current month)
        this.prismaService.checkIn.count({
          where: {
            gymClientId: clientId,
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),
        // Total evaluations
        this.prismaService.evaluation.count({
          where: { gymClientId: clientId },
        }),
        // Active contracts
        this.prismaService.contract.count({
          where: { gymClientId: clientId, status: 'active' },
        }),
        // Total spent (sum of all contract payments)
        this.calculateTotalSpent(clientId),
      ]);

    // Get membership history
    const membershipHistory = await this.prismaService.contract.findMany({
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
    });

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
  private async calculateTotalSpent(clientId: string): Promise<number> {
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
