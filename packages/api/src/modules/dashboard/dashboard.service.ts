import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { RequestContext } from '../../common/services/request-context.service';
import { DashboardStatsDto, RecentActivityDto, ExpiringContractDto, ActivityType } from './dto';
import { startOfMonth, endOfMonth, startOfDay, endOfDay, addDays } from 'date-fns';
import { BusinessException } from '../../common/exceptions/business.exception';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

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
    const thirtyDaysFromNow = addDays(now, 30);

    // Execute all queries in parallel for better performance
    const [
      totalClients,
      activeClientsCount,
      totalContracts,
      activeContractsCount,
      monthlyRevenue,
      todayCheckInsCount,
      expiringContractsCount,
      newClientsThisMonth,
    ] = await Promise.all([
      // Total clients
      this.prisma.gymClient.count({
        where: {
          gymId,
          deletedAt: null,
        },
      }),

      // Active clients (with at least one active contract)
      this.prisma.gymClient.count({
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
      this.prisma.contract.count({
        where: {
          gymClient: {
            gymId,
          },
          deletedAt: null,
        },
      }),

      // Active contracts
      this.prisma.contract.count({
        where: {
          gymClient: {
            gymId,
          },
          status: 'active',
          deletedAt: null,
        },
      }),

      // Monthly revenue (sum of active contracts' final prices)
      this.prisma.contract
        .aggregate({
          _sum: {
            finalAmount: true,
          },
          where: {
            gymClient: {
              gymId,
            },
            status: 'active',
            startDate: {
              gte: startOfCurrentMonth,
              lte: endOfCurrentMonth,
            },
            deletedAt: null,
          },
        })
        .then((result) => result._sum.finalAmount || 0),

      // Today's check-ins
      this.prisma.checkIn.count({
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
      this.prisma.contract.count({
        where: {
          gymClient: {
            gymId,
          },
          status: 'active',
          endDate: {
            gte: now,
            lte: thirtyDaysFromNow,
          },
          deletedAt: null,
        },
      }),

      // New clients this month
      this.prisma.gymClient.count({
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
      monthlyRevenue: Number(monthlyRevenue),
      todayCheckIns: todayCheckInsCount,
      expiringContractsCount,
      newClientsThisMonth,
    };
  }

  async getRecentActivity(ctx: RequestContext, limit: number = 10): Promise<RecentActivityDto[]> {
    const gymId = ctx.getGymId();
    if (!gymId) {
      throw new BusinessException('Gym context is required');
    }

    // Fetch recent activities from different sources
    const [recentCheckIns, recentClients, recentContracts, expiredContracts] = await Promise.all([
      // Recent check-ins
      this.prisma.checkIn.findMany({
        where: {
          gymClient: {
            gymId,
          },
          deletedAt: null,
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: limit,
        include: {
          gymClient: true,
        },
      }),

      // Recent new clients
      this.prisma.gymClient.findMany({
        where: {
          gymId,
          deletedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      }),

      // Recent new contracts
      this.prisma.contract.findMany({
        where: {
          gymClient: {
            gymId,
          },
          deletedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        include: {
          gymClient: true,
        },
      }),

      // Recently expired contracts
      this.prisma.contract.findMany({
        where: {
          gymClient: {
            gymId,
          },
          status: 'expired',
          deletedAt: null,
          updatedAt: {
            gte: addDays(new Date(), -7), // Last 7 days
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: limit,
        include: {
          gymClient: true,
        },
      }),
    ]);

    // Convert to activity DTOs
    const activities: RecentActivityDto[] = [];

    // Add check-ins
    recentCheckIns.forEach((checkIn) => {
      activities.push({
        id: checkIn.id,
        type: ActivityType.CHECK_IN,
        description: 'Check-in registrado',
        timestamp: checkIn.timestamp.toISOString(),
        clientName: (checkIn as any).gymClient.name,
        clientId: checkIn.gymClientId,
      });
    });

    // Add new clients
    recentClients.forEach((gymClient) => {
      activities.push({
        id: gymClient.id,
        type: ActivityType.NEW_CLIENT,
        description: 'Nuevo cliente registrado',
        timestamp: gymClient.createdAt.toISOString(),
        clientName: gymClient.name,
        clientId: gymClient.id,
      });
    });

    // Add new contracts
    recentContracts.forEach((contract) => {
      activities.push({
        id: contract.id,
        type: ActivityType.NEW_CONTRACT,
        description: 'Nuevo contrato creado',
        timestamp: contract.createdAt.toISOString(),
        clientName: (contract as any).gymClient.name,
        clientId: (contract as any).gymClient.id,
      });
    });

    // Add expired contracts
    expiredContracts.forEach((contract) => {
      activities.push({
        id: contract.id,
        type: ActivityType.CONTRACT_EXPIRED,
        description: 'Contrato expirado',
        timestamp: contract.updatedAt.toISOString(),
        clientName: (contract as any).gymClient.name,
        clientId: (contract as any).gymClient.id,
      });
    });

    // Sort by timestamp and return the most recent
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async getExpiringContracts(
    ctx: RequestContext,
    limit: number = 10,
  ): Promise<ExpiringContractDto[]> {
    const gymId = ctx.getGymId();
    if (!gymId) {
      throw new BusinessException('Gym context is required');
    }

    const now = new Date();
    const thirtyDaysFromNow = addDays(now, 30);

    const expiringContracts = await this.prisma.contract.findMany({
      where: {
        gymClient: {
          gymId,
        },
        status: 'active',
        endDate: {
          gte: now,
          lte: thirtyDaysFromNow,
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
