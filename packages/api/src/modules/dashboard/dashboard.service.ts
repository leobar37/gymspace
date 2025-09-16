import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { RequestContext } from '../../common/services/request-context.service';
import {
  DashboardStatsDto,
  ExpiringContractDto,
  ContractsRevenueDto,
  SalesRevenueDto,
  DebtsDto,
  CheckInsDto,
  NewClientsDto,
} from './dto';
import {
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  addDays,
  differenceInDays,
} from 'date-fns';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ContractStatus } from '@gymspace/shared';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper method to get date range for queries
   * @param startDate - Optional start date string
   * @param endDate - Optional end date string
   * @param defaultStartFn - Function to get default start date
   * @param defaultEndFn - Function to get default end date
   * @returns Object with start and end Date objects
   */
  private getDateRange(
    startDate?: string,
    endDate?: string,
    defaultStartFn: () => Date = () => startOfMonth(new Date()),
    defaultEndFn: () => Date = () => endOfMonth(new Date()),
  ): { start: Date; end: Date } {
    const start = startDate ? new Date(startDate) : defaultStartFn();
    const end = endDate ? new Date(endDate) : defaultEndFn();
    return { start, end };
  }

  async getDashboardStats(ctx: RequestContext): Promise<DashboardStatsDto> {
    const gymId = ctx.getGymId();
    if (!gymId) {
      throw new BusinessException('Gym context is required');
    }

    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);
    const startOfToday = startOfDay(now);
    const endOfToday = endOfDay(now);

    // Execute all queries within a transaction for consistency
    return await this.prisma.$transaction(async (tx) => {
      const [
        totalClients,
        activeClientsCount,
        totalContracts,
        activeContractsCount,
        todayCheckInsCount,
        expiringContractsCount,
        newClientsThisMonth,
      ] = await Promise.all([
        // Total clients
        tx.gymClient.count({
          where: {
            gymId,
            deletedAt: null,
          },
        }),

        // Active clients (with at least one active contract)
        tx.gymClient.count({
          where: {
            gymId,
            deletedAt: null,
            contracts: {
              some: {
                status: 'active',
                deletedAt: null,
              },
            },
          },
        }),

        // Total contracts
        tx.contract.count({
          where: {
            gymClient: {
              gymId,
            },
            deletedAt: null,
          },
        }),

        // Active contracts
        tx.contract.count({
          where: {
            gymClient: {
              gymId,
            },
            status: 'active',
            deletedAt: null,
          },
        }),

        // Today's check-ins
        tx.checkIn.count({
          where: {
            gymClient: {
              gymId,
            },
            timestamp: {
              gte: startOfToday,
              lte: endOfToday,
            },
            deletedAt: null,
          },
        }),

        // Contracts expiring in the next 30 days
        tx.contract.count({
          where: {
            gymClient: {
              gymId,
            },
            status: ContractStatus.EXPIRING_SOON,
            deletedAt: null,
          },
        }),

        // New clients this month
        tx.gymClient.count({
          where: {
            gymId,
            createdAt: {
              gte: startOfCurrentMonth,
              lte: endOfCurrentMonth,
            },
            deletedAt: null,
          },
        }),
      ]);

      return {
        totalClients,
        activeClients: activeClientsCount,
        totalContracts,
        activeContracts: activeContractsCount,
        monthlyRevenue: 0, // Removed from stats, use contracts-revenue endpoint instead
        todayCheckIns: todayCheckInsCount,
        expiringContractsCount,
        newClientsThisMonth,
      };
    });
  }

  async getContractsRevenue(
    ctx: RequestContext,
    startDate?: string,
    endDate?: string,
  ): Promise<ContractsRevenueDto> {
    const gymId = ctx.getGymId();
    if (!gymId) {
      throw new BusinessException('Gym context is required');
    }

    const { start, end } = this.getDateRange(startDate, endDate);

    const result = await this.prisma.contract.aggregate({
      _sum: {
        finalAmount: true,
      },
      _count: {
        id: true,
      },
      where: {
        gymClient: {
          gymId,
        },
        startDate: {
          gte: start,
          lte: end,
        },
        deletedAt: null,
      },
    });

    const totalRevenue = Number(result._sum.finalAmount || 0);
    const contractCount = result._count.id;
    const averageRevenue = contractCount > 0 ? totalRevenue / contractCount : 0;

    return {
      totalRevenue,
      contractCount,
      averageRevenue: Math.round(averageRevenue * 100) / 100,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }

  async getSalesRevenue(
    ctx: RequestContext,
    startDate?: string,
    endDate?: string,
  ): Promise<SalesRevenueDto> {
    const gymId = ctx.getGymId();
    if (!gymId) {
      throw new BusinessException('Gym context is required');
    }

    const { start, end } = this.getDateRange(startDate, endDate);

    const result = await this.prisma.sale.aggregate({
      _sum: {
        total: true,
      },
      _count: {
        id: true,
      },
      where: {
        gymId,
        saleDate: {
          gte: start,
          lte: end,
        },
        deletedAt: null,
      },
    });

    const totalRevenue = Number(result._sum.total || 0);
    const salesCount = result._count.id;
    const averageRevenue = salesCount > 0 ? totalRevenue / salesCount : 0;

    return {
      totalRevenue,
      salesCount,
      averageRevenue: Math.round(averageRevenue * 100) / 100,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }

  async getDebts(ctx: RequestContext, startDate?: string, endDate?: string): Promise<DebtsDto> {
    const gymId = ctx.getGymId();
    if (!gymId) {
      throw new BusinessException('Gym context is required');
    }

    const { start, end } = this.getDateRange(startDate, endDate);

    // Get unpaid sales within the date range
    const unpaidSales = await this.prisma.sale.findMany({
      where: {
        gymId,
        saleDate: {
          gte: start,
          lte: end,
        },
        paymentStatus: 'unpaid',
        deletedAt: null,
      },
      select: {
        total: true,
        customerId: true,
      },
    });

    const totalDebt = unpaidSales.reduce((sum, sale) => sum + Number(sale.total), 0);

    // Count unique customers with debts (excluding null customerIds)
    const customerIds = unpaidSales
      .filter((sale) => sale.customerId !== null)
      .map((sale) => sale.customerId);
    const uniqueClients = new Set(customerIds).size;

    const averageDebt = uniqueClients > 0 ? totalDebt / uniqueClients : 0;

    return {
      totalDebt,
      clientsWithDebt: uniqueClients,
      averageDebt: Math.round(averageDebt * 100) / 100,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }

  async getCheckIns(
    ctx: RequestContext,
    startDate?: string,
    endDate?: string,
  ): Promise<CheckInsDto> {
    const gymId = ctx.getGymId();
    if (!gymId) {
      throw new BusinessException('Gym context is required');
    }

    const { start, end } = this.getDateRange(
      startDate,
      endDate,
      () => startOfDay(new Date()),
      () => endOfDay(new Date()),
    );

    const checkIns = await this.prisma.checkIn.findMany({
      where: {
        gymId: {
          equals: gymId,
        },
        timestamp: {
          gte: start,
          lte: end,
        },
        deletedAt: null,
      },
      select: {
        gymClientId: true,
      },
    });

    const totalCheckIns = checkIns.length;
    const uniqueClients = new Set(checkIns.map((c) => c.gymClientId)).size;

    const daysDiff = Math.max(1, differenceInDays(end, start) + 1);
    const averagePerDay = totalCheckIns / daysDiff;

    return {
      totalCheckIns,
      uniqueClients,
      averagePerDay: Math.round(averagePerDay * 100) / 100,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }

  async getNewClients(
    ctx: RequestContext,
    startDate?: string,
    endDate?: string,
  ): Promise<NewClientsDto> {
    const gymId = ctx.getGymId();
    if (!gymId) {
      throw new BusinessException('Gym context is required');
    }

    const { start, end } = this.getDateRange(startDate, endDate);

    const newClientsCount = await this.prisma.gymClient.count({
      where: {
        gymId,
        createdAt: {
          gte: start,
          lte: end,
        },
        deletedAt: null,
      },
    });

    const daysDiff = Math.max(1, differenceInDays(end, start) + 1);
    const averagePerDay = newClientsCount / daysDiff;

    return {
      totalNewClients: newClientsCount,
      averagePerDay: Math.round(averagePerDay * 100) / 100,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }

  async getExpiringContracts(
    ctx: RequestContext,
    limit: number = 10,
    startDate?: string,
    endDate?: string,
  ): Promise<ExpiringContractDto[]> {
    const gymId = ctx.getGymId();
    if (!gymId) {
      throw new BusinessException('Gym context is required');
    }

    const now = new Date();

    const { start, end } = this.getDateRange(
      startDate,
      endDate,
      () => now,
      () => addDays(now, 30),
    );

    // Query directly for better performance
    const expiringContracts = await this.prisma.contract.findMany({
      where: {
        gymClient: {
          gymId,
        },
        endDate: {
          gte: start,
          lte: end,
        },
        deletedAt: null,
      },
      orderBy: {
        endDate: 'asc', // Show soonest expiring first
      },
      take: limit,
      include: {
        gymClient: true,
        gymMembershipPlan: true,
      },
    });

    return expiringContracts.map((contract) => {
      const daysRemaining = Math.ceil(
        (contract.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      return {
        id: contract.id,
        clientName: (contract as any).gymClient.name,
        clientId: (contract as any).gymClient.id,
        planName: (contract as any).gymMembershipPlan.name,
        endDate: contract.endDate.toISOString(),
        daysRemaining,
      };
    });
  }
}
