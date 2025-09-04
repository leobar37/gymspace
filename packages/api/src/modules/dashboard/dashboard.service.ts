import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { CacheService } from '../../core/cache/cache.service';
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
import { startOfMonth, endOfMonth, startOfDay, endOfDay, addDays, differenceInDays } from 'date-fns';
import { BusinessException } from '../../common/exceptions/business.exception';
import { CACHE_TTL, ContractStatus } from '@gymspace/shared';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  async getDashboardStats(ctx: RequestContext): Promise<DashboardStatsDto> {
    const gymId = ctx.getGymId();
    if (!gymId) {
      throw new BusinessException('Gym context is required');
    }

    const cacheKey = this.getDashboardStatsKey(gymId);

    return await this.cacheService.getOrSet(
      cacheKey,
      async () => {
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
      },
      CACHE_TTL.REPORTS, // Cache for 5 minutes
    );
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

    const start = startDate ? new Date(startDate) : startOfMonth(new Date());
    const end = endDate ? new Date(endDate) : endOfMonth(new Date());

    const cacheKey = `gym:${gymId}:dashboard:contracts-revenue:${start.toISOString()}:${end.toISOString()}`;

    return await this.cacheService.getOrSet(
      cacheKey,
      async () => {
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
      },
      CACHE_TTL.DASHBOARD,
    );
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

    const start = startDate ? new Date(startDate) : startOfMonth(new Date());
    const end = endDate ? new Date(endDate) : endOfMonth(new Date());

    const cacheKey = `gym:${gymId}:dashboard:sales-revenue:${start.toISOString()}:${end.toISOString()}`;

    return await this.cacheService.getOrSet(
      cacheKey,
      async () => {
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
      },
      CACHE_TTL.DASHBOARD,
    );
  }

  async getDebts(
    ctx: RequestContext,
    startDate?: string,
    endDate?: string,
  ): Promise<DebtsDto> {
    const gymId = ctx.getGymId();
    if (!gymId) {
      throw new BusinessException('Gym context is required');
    }

    const start = startDate ? new Date(startDate) : startOfMonth(new Date());
    const end = endDate ? new Date(endDate) : endOfMonth(new Date());

    const cacheKey = `gym:${gymId}:dashboard:debts:${start.toISOString()}:${end.toISOString()}`;

    return await this.cacheService.getOrSet(
      cacheKey,
      async () => {
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

        const totalDebt = unpaidSales.reduce(
          (sum, sale) => sum + Number(sale.total),
          0,
        );
        
        // Count unique customers with debts (excluding null customerIds)
        const customerIds = unpaidSales
          .filter(sale => sale.customerId !== null)
          .map(sale => sale.customerId);
        const uniqueClients = new Set(customerIds).size;
        
        const averageDebt = uniqueClients > 0 ? totalDebt / uniqueClients : 0;

        return {
          totalDebt,
          clientsWithDebt: uniqueClients,
          averageDebt: Math.round(averageDebt * 100) / 100,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        };
      },
      CACHE_TTL.DASHBOARD,
    );
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

    const start = startDate ? new Date(startDate) : startOfDay(new Date());
    const end = endDate ? new Date(endDate) : endOfDay(new Date());

    const cacheKey = `gym:${gymId}:dashboard:check-ins:${start.toISOString()}:${end.toISOString()}`;

    return await this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const checkIns = await this.prisma.checkIn.findMany({
          where: {
            gymClient: {
              gymId,
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
      },
      CACHE_TTL.DASHBOARD,
    );
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

    const start = startDate ? new Date(startDate) : startOfMonth(new Date());
    const end = endDate ? new Date(endDate) : endOfMonth(new Date());

    const cacheKey = `gym:${gymId}:dashboard:new-clients:${start.toISOString()}:${end.toISOString()}`;

    return await this.cacheService.getOrSet(
      cacheKey,
      async () => {
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
      },
      CACHE_TTL.DASHBOARD,
    );
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

    const start = startDate ? new Date(startDate) : now;
    const end = endDate ? new Date(endDate) : addDays(now, 30);

    // Use caching for expiring contracts to reduce database load
    const cacheKey = `gym:${gymId}:dashboard:expiring-contracts:${limit}:${start.toISOString()}:${end.toISOString()}`;

    return await this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // Remove transaction and query directly for better performance
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
      },
      CACHE_TTL.DASHBOARD, // Use dashboard cache TTL (shorter than reports)
    );
  }

  private getDashboardStatsKey(gymId: string): string {
    return `gym:${gymId}:dashboard:stats`;
  }
}
