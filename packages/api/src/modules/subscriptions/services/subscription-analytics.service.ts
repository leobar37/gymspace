import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { SubscriptionCacheService } from './subscription-cache.service';
import { 
  SubscriptionAnalyticsDto,
  SubscriptionAnalyticsQueryDto,
  AnalyticsPeriod,
  SubscriptionMetricsDto,
  PlanUsageDto,
  TrendDataPointDto,
  RevenueAnalyticsDto,
  RevenueMetricsDto,
  RevenuePlanBreakdownDto,
  UsageTrendsDto,
  OrganizationUsageDto,
} from '../dto/admin';

@Injectable()
export class SubscriptionAnalyticsService {
  private readonly logger = new Logger(SubscriptionAnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: SubscriptionCacheService,
  ) {}

  /**
   * Get comprehensive subscription analytics with caching
   */
  async getSubscriptionAnalytics(
    query: SubscriptionAnalyticsQueryDto,
  ): Promise<SubscriptionAnalyticsDto> {
    this.logger.log(`Generating subscription analytics for period: ${query.period}`);

    // Generate cache key
    const cacheKey = this.cacheService.generateSubscriptionAnalyticsKey(
      query.period,
      query.startDate,
      query.endDate,
    );

    // Try to get from cache first
    const cachedData = await this.cacheService.getAnalytics<SubscriptionAnalyticsDto>(cacheKey);
    if (cachedData) {
      this.logger.log(`Returning cached subscription analytics for period: ${query.period}`);
      return cachedData;
    }

    try {
      const { startDate, endDate } = this.getDateRange(query);

      // Get all data in parallel
      const [metrics, planUsage, growthTrend, churnTrend] = await Promise.all([
        this.getSubscriptionMetrics(startDate, endDate),
        this.getPlanUsage(),
        this.getGrowthTrend(startDate, endDate),
        this.getChurnTrend(startDate, endDate),
      ]);

      const result = {
        period: query.period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        metrics,
        planUsage,
        growthTrend,
        churnTrend,
        generatedAt: new Date().toISOString(),
      };

      // Cache the result for 5 minutes
      await this.cacheService.setAnalytics(cacheKey, result, 300);

      this.logger.log(`Successfully generated subscription analytics for period: ${query.period}`, {
        totalActiveSubscriptions: metrics.totalActiveSubscriptions,
        newSubscriptions: metrics.newSubscriptions,
        churnRate: metrics.churnRate,
        growthRate: metrics.growthRate,
      });

      return result;
    } catch (error) {
      this.logger.error(`Failed to generate subscription analytics for period: ${query.period}`, error);
      throw new Error(`Failed to generate subscription analytics: ${error.message}`);
    }
  }

  /**
   * Get revenue analytics with caching
   */
  async getRevenueAnalytics(
    query: SubscriptionAnalyticsQueryDto,
  ): Promise<RevenueAnalyticsDto> {
    this.logger.log(`Generating revenue analytics for period: ${query.period}`);

    // Generate cache key
    const cacheKey = this.cacheService.generateRevenueAnalyticsKey(
      query.period,
      query.startDate,
      query.endDate,
    );

    // Try to get from cache first
    const cachedData = await this.cacheService.getAnalytics<RevenueAnalyticsDto>(cacheKey);
    if (cachedData) {
      this.logger.log(`Returning cached revenue analytics for period: ${query.period}`);
      return cachedData;
    }

    const { startDate, endDate } = this.getDateRange(query);

    // Get revenue data in parallel
    const [metrics, planBreakdown, monthlyTrend] = await Promise.all([
      this.getRevenueMetrics(startDate, endDate),
      this.getRevenuePlanBreakdown(),
      this.getMonthlyRevenueTrend(startDate, endDate),
    ]);

    const result = {
      period: query.period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      metrics,
      planBreakdown,
      monthlyTrend,
      generatedAt: new Date().toISOString(),
    };

    // Cache the result for 5 minutes
    await this.cacheService.setAnalytics(cacheKey, result, 300);

    return result;
  }

  /**
   * Get usage trends analytics with caching
   */
  async getUsageTrends(
    query: SubscriptionAnalyticsQueryDto,
  ): Promise<UsageTrendsDto> {
    this.logger.log(`Generating usage trends for period: ${query.period}`);

    // Generate cache key
    const cacheKey = this.cacheService.generateUsageTrendsKey(
      query.period,
      query.startDate,
      query.endDate,
    );

    // Try to get from cache first
    const cachedData = await this.cacheService.getAnalytics<UsageTrendsDto>(cacheKey);
    if (cachedData) {
      this.logger.log(`Returning cached usage trends for period: ${query.period}`);
      return cachedData;
    }

    const { startDate, endDate } = this.getDateRange(query);

    // Get usage data in parallel
    const [organizationUsage, utilizationTrend, featureUsage] = await Promise.all([
      this.getOrganizationUsage(),
      this.getUtilizationTrend(startDate, endDate),
      this.getFeatureUsage(),
    ]);

    const nearingLimitsCount = organizationUsage.filter(org => org.nearingLimits).length;

    const result = {
      period: query.period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      organizationUsage,
      utilizationTrend,
      featureUsage,
      nearingLimitsCount,
      generatedAt: new Date().toISOString(),
    };

    // Cache the result for 5 minutes
    await this.cacheService.setAnalytics(cacheKey, result, 300);

    return result;
  }

  /**
   * Get subscription metrics for a period
   */
  private async getSubscriptionMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<SubscriptionMetricsDto> {
    const [
      totalActive,
      totalInactive,
      newSubscriptions,
      cancelledSubscriptions,
      upgradedSubscriptions,
      downgradedSubscriptions,
      avgDuration,
    ] = await Promise.all([
      // Total active subscriptions
      this.prisma.subscriptionOrganization.count({
        where: { isActive: true, deletedAt: null },
      }),
      
      // Total inactive subscriptions
      this.prisma.subscriptionOrganization.count({
        where: { isActive: false, deletedAt: null },
      }),
      
      // New subscriptions in period
      this.prisma.subscriptionOrganization.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          deletedAt: null,
        },
      }),
      
      // Cancelled subscriptions in period
      this.prisma.subscriptionOperation.count({
        where: {
          operationType: 'cancellation',
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      
      // Upgraded subscriptions in period
      this.prisma.subscriptionOperation.count({
        where: {
          operationType: 'upgrade',
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      
      // Downgraded subscriptions in period
      this.prisma.subscriptionOperation.count({
        where: {
          operationType: 'downgrade',
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      
      // Average subscription duration
      this.getAverageSubscriptionDuration(),
    ]);

    // Calculate rates
    const totalPreviousActive = totalActive - newSubscriptions + cancelledSubscriptions;
    const churnRate = totalPreviousActive > 0 ? (cancelledSubscriptions / totalPreviousActive) * 100 : 0;
    const growthRate = totalPreviousActive > 0 ? (newSubscriptions / totalPreviousActive) * 100 : 0;

    return {
      totalActiveSubscriptions: totalActive,
      totalInactiveSubscriptions: totalInactive,
      newSubscriptions,
      cancelledSubscriptions,
      upgradedSubscriptions,
      downgradedSubscriptions,
      churnRate: Number(churnRate.toFixed(2)),
      growthRate: Number(growthRate.toFixed(2)),
      averageSubscriptionDuration: avgDuration,
    };
  }

  /**
   * Get plan usage statistics
   */
  private async getPlanUsage(): Promise<PlanUsageDto[]> {
    const plans = await this.prisma.subscriptionPlan.findMany({
      where: { deletedAt: null },
      include: {
        _count: {
          select: {
            subscriptionOrganizations: {
              where: { isActive: true, deletedAt: null },
            },
          },
        },
        subscriptionOrganizations: {
          where: { isActive: true, deletedAt: null },
          select: { id: true },
        },
      },
    });

    const totalActiveSubscriptions = await this.prisma.subscriptionOrganization.count({
      where: { isActive: true, deletedAt: null },
    });

    return plans.map(plan => {
      const activeCount = plan._count.subscriptionOrganizations;
      const marketShare = totalActiveSubscriptions > 0 ? 
        (activeCount / totalActiveSubscriptions) * 100 : 0;
      
      // Calculate MRR based on plan price
      const planPrice = typeof plan.price === 'object' && plan.price !== null ? 
        (plan.price as any).amount || 0 : 0;
      const mrr = activeCount * planPrice;

      return {
        planId: plan.id,
        planName: plan.name,
        activeCount,
        totalCount: plan.subscriptionOrganizations.length,
        marketShare: Number(marketShare.toFixed(2)),
        mrr,
      };
    });
  }

  /**
   * Get growth trend data
   */
  private async getGrowthTrend(startDate: Date, endDate: Date): Promise<TrendDataPointDto[]> {
    // Generate daily data points for the last 30 days
    const days = 30;
    const trendData: TrendDataPointDto[] = [];
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const newSubscriptions = await this.prisma.subscriptionOrganization.count({
        where: {
          createdAt: { gte: date, lte: dayEnd },
          deletedAt: null,
        },
      });
      
      trendData.push({
        date: date.toISOString().split('T')[0],
        value: newSubscriptions,
        label: 'New Subscriptions',
      });
    }
    
    return trendData;
  }

  /**
   * Get churn trend data
   */
  private async getChurnTrend(startDate: Date, endDate: Date): Promise<TrendDataPointDto[]> {
    // Generate weekly churn data for the last 12 weeks
    const weeks = 12;
    const trendData: TrendDataPointDto[] = [];
    
    for (let i = weeks; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      const cancelledSubscriptions = await this.prisma.subscriptionOperation.count({
        where: {
          operationType: 'cancellation',
          createdAt: { gte: weekStart, lte: weekEnd },
        },
      });
      
      trendData.push({
        date: weekStart.toISOString().split('T')[0],
        value: cancelledSubscriptions,
        label: 'Cancelled Subscriptions',
      });
    }
    
    return trendData;
  }

  /**
   * Get revenue metrics
   */
  private async getRevenueMetrics(startDate: Date, endDate: Date): Promise<RevenueMetricsDto> {
    // Get all active subscriptions with plan pricing
    const activeSubscriptions = await this.prisma.subscriptionOrganization.findMany({
      where: { isActive: true, deletedAt: null },
      include: {
        subscriptionPlan: {
          select: { price: true, billingFrequency: true },
        },
      },
    });

    let totalMrr = 0;
    let totalArr = 0;

    activeSubscriptions.forEach(subscription => {
      const planPrice = typeof subscription.subscriptionPlan.price === 'object' && 
        subscription.subscriptionPlan.price !== null ? 
        (subscription.subscriptionPlan.price as any).amount || 0 : 0;
      
      // Convert to MRR based on billing frequency
      let monthlyPrice = planPrice;
      if (subscription.subscriptionPlan.billingFrequency === 'annual') {
        monthlyPrice = planPrice / 12;
      } else if (subscription.subscriptionPlan.billingFrequency === 'quarterly') {
        monthlyPrice = planPrice / 3;
      }
      
      totalMrr += monthlyPrice;
      totalArr += monthlyPrice * 12;
    });

    // Calculate other metrics (simplified calculations)
    const avgCustomers = activeSubscriptions.length;
    const arpu = avgCustomers > 0 ? totalMrr / avgCustomers : 0;
    const ltv = arpu * 24; // Simplified: ARPU * 24 months

    return {
      totalMrr: Number(totalMrr.toFixed(2)),
      totalArr: Number(totalArr.toFixed(2)),
      newMrr: 0, // Would need period-specific calculations
      churnedMrr: 0, // Would need period-specific calculations
      expansionMrr: 0, // Would need upgrade tracking
      contractionMrr: 0, // Would need downgrade tracking
      netMrrChange: 0, // Would need period comparison
      arpu: Number(arpu.toFixed(2)),
      ltv: Number(ltv.toFixed(2)),
    };
  }

  /**
   * Get revenue breakdown by plan
   */
  private async getRevenuePlanBreakdown(): Promise<RevenuePlanBreakdownDto[]> {
    const planRevenue = await this.prisma.subscriptionPlan.findMany({
      where: { deletedAt: null },
      include: {
        subscriptionOrganizations: {
          where: { isActive: true, deletedAt: null },
        },
      },
    });

    let totalMrr = 0;
    
    // Calculate total MRR first
    planRevenue.forEach(plan => {
      const planPrice = typeof plan.price === 'object' && plan.price !== null ? 
        (plan.price as any).amount || 0 : 0;
      
      let monthlyPrice = planPrice;
      if (plan.billingFrequency === 'annual') {
        monthlyPrice = planPrice / 12;
      } else if (plan.billingFrequency === 'quarterly') {
        monthlyPrice = planPrice / 3;
      }
      
      totalMrr += monthlyPrice * plan.subscriptionOrganizations.length;
    });

    return planRevenue.map(plan => {
      const planPrice = typeof plan.price === 'object' && plan.price !== null ? 
        (plan.price as any).amount || 0 : 0;
      
      let monthlyPrice = planPrice;
      if (plan.billingFrequency === 'annual') {
        monthlyPrice = planPrice / 12;
      } else if (plan.billingFrequency === 'quarterly') {
        monthlyPrice = planPrice / 3;
      }
      
      const planMrr = monthlyPrice * plan.subscriptionOrganizations.length;
      const planArr = planMrr * 12;
      const revenueShare = totalMrr > 0 ? (planMrr / totalMrr) * 100 : 0;
      const arpu = plan.subscriptionOrganizations.length > 0 ? 
        planMrr / plan.subscriptionOrganizations.length : 0;

      return {
        planId: plan.id,
        planName: plan.name,
        mrr: Number(planMrr.toFixed(2)),
        arr: Number(planArr.toFixed(2)),
        revenueShare: Number(revenueShare.toFixed(2)),
        activeSubscriptions: plan.subscriptionOrganizations.length,
        arpu: Number(arpu.toFixed(2)),
      };
    });
  }

  /**
   * Get monthly revenue trend
   */
  private async getMonthlyRevenueTrend(startDate: Date, endDate: Date) {
    // Generate monthly data for the last 12 months
    const months = 12;
    const trendData = [];
    
    for (let i = months; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);
      monthEnd.setHours(23, 59, 59, 999);
      
      // Simplified revenue calculation
      const monthlySubscriptions = await this.prisma.subscriptionOrganization.count({
        where: {
          isActive: true,
          startDate: { lte: monthEnd },
          endDate: { gte: monthStart },
          deletedAt: null,
        },
      });
      
      const revenue = monthlySubscriptions * 100; // Simplified calculation
      const growth = i === months ? 0 : Math.random() * 10 - 5; // Placeholder
      
      trendData.push({
        month: monthStart.toISOString().substring(0, 7), // YYYY-MM format
        revenue,
        growth: Number(growth.toFixed(1)),
      });
    }
    
    return trendData;
  }

  /**
   * Get organization usage data
   */
  private async getOrganizationUsage(): Promise<OrganizationUsageDto[]> {
    const organizations = await this.prisma.organization.findMany({
      where: { deletedAt: null },
      include: {
        subscriptionOrganizations: {
          where: { isActive: true, deletedAt: null },
          include: {
            subscriptionPlan: {
              select: { 
                name: true, 
                maxGyms: true, 
                maxClientsPerGym: true, 
                maxUsersPerGym: true,
              },
            },
          },
          take: 1,
        },
        gyms: {
          where: { deletedAt: null },
          include: {
            gymClients: {
              where: { deletedAt: null },
            },
            collaborators: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });

    return organizations
      .filter(org => org.subscriptionOrganizations.length > 0)
      .map(org => {
        const subscription = org.subscriptionOrganizations[0];
        const plan = subscription.subscriptionPlan;
        
        const gymCount = org.gyms.length;
        const clientCount = org.gyms.reduce((sum, gym) => sum + gym.gymClients.length, 0);
        const userCount = org.gyms.reduce((sum, gym) => sum + gym.collaborators.length, 0);
        
        // Calculate utilization based on plan limits
        const gymUtilization = plan.maxGyms > 0 ? (gymCount / plan.maxGyms) * 100 : 0;
        const clientUtilization = plan.maxClientsPerGym > 0 ? 
          (clientCount / (plan.maxClientsPerGym * gymCount)) * 100 : 0;
        const userUtilization = plan.maxUsersPerGym > 0 ? 
          (userCount / (plan.maxUsersPerGym * gymCount)) * 100 : 0;
        
        const utilizationPercentage = Math.max(gymUtilization, clientUtilization, userUtilization);
        const nearingLimits = utilizationPercentage > 80;
        
        // Get last activity (simplified)
        const lastActivityAt = new Date();
        lastActivityAt.setDays(lastActivityAt.getDate() - Math.floor(Math.random() * 30));
        
        return {
          organizationId: org.id,
          organizationName: org.name,
          planName: plan.name,
          gymCount,
          clientCount,
          userCount,
          utilizationPercentage: Number(utilizationPercentage.toFixed(1)),
          nearingLimits,
          lastActivityAt: lastActivityAt.toISOString(),
          subscriptionStartDate: subscription.startDate.toISOString(),
        };
      });
  }

  /**
   * Get utilization trend over time
   */
  private async getUtilizationTrend(startDate: Date, endDate: Date) {
    // Generate weekly utilization data
    const weeks = 12;
    const trendData = [];
    
    for (let i = weeks; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7));
      
      const avgUtilization = 60 + Math.random() * 20; // Simplified calculation
      const totalOrgs = await this.prisma.organization.count({
        where: { deletedAt: null },
      });
      
      trendData.push({
        date: weekStart.toISOString().split('T')[0],
        avgUtilization: Number(avgUtilization.toFixed(1)),
        totalOrgs,
      });
    }
    
    return trendData;
  }

  /**
   * Get feature usage statistics
   */
  private async getFeatureUsage() {
    // This would analyze feature usage across organizations
    // For now, return placeholder data
    return [
      {
        feature: 'inventory_management',
        usage: 85,
        totalEligible: 100,
        usagePercentage: 85,
      },
      {
        feature: 'client_evaluations',
        usage: 60,
        totalEligible: 100,
        usagePercentage: 60,
      },
      {
        feature: 'lead_management',
        usage: 45,
        totalEligible: 100,
        usagePercentage: 45,
      },
    ];
  }

  /**
   * Get average subscription duration in days
   */
  private async getAverageSubscriptionDuration(): Promise<number> {
    const subscriptions = await this.prisma.subscriptionOrganization.findMany({
      where: { deletedAt: null },
      select: { startDate: true, endDate: true },
    });

    if (subscriptions.length === 0) return 0;

    const totalDays = subscriptions.reduce((sum, sub) => {
      const duration = Math.ceil(
        (sub.endDate.getTime() - sub.startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return sum + duration;
    }, 0);

    return Math.round(totalDays / subscriptions.length);
  }

  /**
   * Get date range based on period
   */
  private getDateRange(query: SubscriptionAnalyticsQueryDto): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    let startDate = new Date();

    if (query.period === AnalyticsPeriod.CUSTOM && query.startDate && query.endDate) {
      startDate = new Date(query.startDate);
      endDate.setTime(new Date(query.endDate).getTime());
    } else {
      switch (query.period) {
        case AnalyticsPeriod.LAST_7_DAYS:
          startDate.setDate(startDate.getDate() - 7);
          break;
        case AnalyticsPeriod.LAST_30_DAYS:
          startDate.setDate(startDate.getDate() - 30);
          break;
        case AnalyticsPeriod.LAST_90_DAYS:
          startDate.setDate(startDate.getDate() - 90);
          break;
        case AnalyticsPeriod.LAST_YEAR:
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(startDate.getDate() - 30);
      }
    }

    return { startDate, endDate };
  }
}