import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { RequestContext } from '../../../common/services/request-context.service';
import { ClientStatsResult, ClientStat } from '../domain/client-stats.types';
import { ClientBaseService } from './client.base';

@Injectable()
export class ClientStatsService {
  constructor(
    private prismaService: PrismaService,
    private clientBaseService: ClientBaseService,
  ) {}

  /**
   * Declarative statistics configuration
   */
  private readonly statDefinitions: Record<string, ClientStat> = {
    totalCheckIns: {
      key: 'totalCheckIns',
      name: 'Total Check-ins',
      description: 'Total number of gym check-ins',
      category: 'activity',
      query: async (tx, clientId: string) => {
        return tx.checkIn.count({
          where: { gymClientId: clientId },
        });
      },
      format: (value: number) => value,
    },
    monthlyCheckIns: {
      key: 'monthlyCheckIns',
      name: 'Monthly Check-ins',
      description: 'Check-ins in current month',
      category: 'activity',
      query: async (tx, clientId: string) => {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return tx.checkIn.count({
          where: {
            gymClientId: clientId,
            createdAt: { gte: firstDayOfMonth },
          },
        });
      },
      format: (value: number) => value,
    },
    activeContracts: {
      key: 'activeContracts',
      name: 'Active Contracts',
      description: 'Number of active contracts',
      category: 'contracts',
      query: async (tx, clientId: string) => {
        return tx.contract.count({
          where: { gymClientId: clientId, status: 'active' },
        });
      },
      format: (value: number) => value,
    },
    totalSpent: {
      key: 'totalSpent',
      name: 'Total Spent',
      description: 'Total amount spent on contracts',
      category: 'contracts',
      query: async (tx, clientId: string) => {
        const result = await tx.contract.aggregate({
          where: { gymClientId: clientId },
          _sum: { finalAmount: true },
        });
        return result._sum.finalAmount || 0;
      },
      format: (value: number) => value,
    },
  };

  /**
   * Get comprehensive client statistics using declarative approach
   */
  async getClientStats(ctx: RequestContext, clientId: string): Promise<ClientStatsResult> {
    // Get client with related data using base service
    const client = await this.clientBaseService.findOne(ctx, clientId, {
      include: {
        checkIns: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    // Execute all statistics in parallel using declarative definitions
    const statsResults = await this.executeStats(clientId);

    // Get membership history separately
    const membershipHistory = await this.getMembershipHistory(clientId);

    return {
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        status: client.status,
        registrationDate: client.createdAt,
      },
      activity: {
        totalCheckIns: statsResults.totalCheckIns,
        monthlyCheckIns: statsResults.monthlyCheckIns,
        lastCheckIn: client.checkIns[0]?.createdAt || null,
      },
      contracts: {
        active: statsResults.activeContracts,
        totalSpent: statsResults.totalSpent,
      },
      membershipHistory,
    };
  }

  /**
   * Execute all statistics using declarative definitions
   */
  private async executeStats(clientId: string): Promise<Record<string, any>> {
    return await this.prismaService.$transaction(async (tx) => {
      const statPromises = Object.entries(this.statDefinitions).map(async ([key, stat]) => {
        const result = await stat.query(tx, clientId);
        return [key, stat.format(result)];
      });

      const results = await Promise.all(statPromises);
      return Object.fromEntries(results);
    });
  }

  /**
   * Get individual statistic by key
   */
  async getStat(ctx: RequestContext, clientId: string, statKey: string): Promise<any> {
    const statDef = this.statDefinitions[statKey];
    if (!statDef) {
      throw new Error(`Unknown statistic: ${statKey}`);
    }

    // Validate client exists
    await this.clientBaseService.findOne(ctx, clientId);

    return await this.prismaService.$transaction(async (tx) => {
      const result = await statDef.query(tx, clientId);
      return {
        key: statDef.key,
        name: statDef.name,
        description: statDef.description,
        category: statDef.category,
        value: statDef.format(result),
      };
    });
  }

  /**
   * Get statistics by category
   */
  async getStatsByCategory(
    ctx: RequestContext,
    clientId: string,
    category: string,
  ): Promise<any[]> {
    const categoryStats = Object.values(this.statDefinitions).filter(
      (stat) => stat.category === category,
    );

    if (categoryStats.length === 0) {
      return [];
    }

    // Validate client exists
    await this.clientBaseService.findOne(ctx, clientId);

    return await this.prismaService.$transaction(async (tx) => {
      const statPromises = categoryStats.map(async (stat) => {
        const result = await stat.query(tx, clientId);
        return {
          key: stat.key,
          name: stat.name,
          description: stat.description,
          category: stat.category,
          value: stat.format(result),
        };
      });

      return Promise.all(statPromises);
    });
  }

  /**
   * Get available statistics definitions
   */
  getAvailableStats(): ClientStat[] {
    return Object.values(this.statDefinitions);
  }

  /**
   * Get membership history
   */
  private async getMembershipHistory(clientId: string) {
    return this.prismaService.contract.findMany({
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
  }

  /**
   * Calculate total amount spent by client
   */
  async calculateTotalSpent(clientId: string): Promise<number> {
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
