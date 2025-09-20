import { Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';

@Injectable()
export class SubscriptionCacheService {
  private readonly logger = new Logger(SubscriptionCacheService.name);
  private readonly DEFAULT_TTL = 300; // 5 minutes in seconds

  constructor(
    @Inject('CACHE_MANAGER') private cacheManager: Cache,
  ) {}

  /**
   * Get cached analytics data
   */
  async getAnalytics<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.cacheManager.get<T>(key);
      if (cached) {
        this.logger.debug(`Cache hit for analytics key: ${key}`);
        return cached;
      }
      this.logger.debug(`Cache miss for analytics key: ${key}`);
      return null;
    } catch (error) {
      this.logger.error(`Error getting from cache: ${key}`, error);
      return null;
    }
  }

  /**
   * Set analytics data in cache
   */
  async setAnalytics<T>(key: string, data: T, ttl?: number): Promise<void> {
    try {
      const cacheTime = ttl || this.DEFAULT_TTL;
      await this.cacheManager.set(key, data, cacheTime);
      this.logger.debug(`Cached analytics data for key: ${key} (TTL: ${cacheTime}s)`);
    } catch (error) {
      this.logger.error(`Error setting cache: ${key}`, error);
    }
  }

  /**
   * Generate cache key for subscription analytics
   */
  generateSubscriptionAnalyticsKey(
    period: string,
    startDate?: string,
    endDate?: string,
  ): string {
    const baseKey = 'subscription_analytics';
    if (period === 'custom' && startDate && endDate) {
      return `${baseKey}_${period}_${startDate}_${endDate}`;
    }
    return `${baseKey}_${period}`;
  }

  /**
   * Generate cache key for revenue analytics
   */
  generateRevenueAnalyticsKey(
    period: string,
    startDate?: string,
    endDate?: string,
  ): string {
    const baseKey = 'revenue_analytics';
    if (period === 'custom' && startDate && endDate) {
      return `${baseKey}_${period}_${startDate}_${endDate}`;
    }
    return `${baseKey}_${period}`;
  }

  /**
   * Generate cache key for usage trends
   */
  generateUsageTrendsKey(
    period: string,
    startDate?: string,
    endDate?: string,
  ): string {
    const baseKey = 'usage_trends';
    if (period === 'custom' && startDate && endDate) {
      return `${baseKey}_${period}_${startDate}_${endDate}`;
    }
    return `${baseKey}_${period}`;
  }

  /**
   * Generate cache key for request analytics
   */
  generateRequestAnalyticsKey(filters: any): string {
    const filterString = Object.entries(filters)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${key}:${value}`)
      .sort()
      .join('_');
    return `request_analytics_${filterString}`;
  }

  /**
   * Generate cache key for organization subscription history
   */
  generateSubscriptionHistoryKey(
    organizationId: string,
    query: any,
  ): string {
    const queryString = Object.entries(query)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${key}:${value}`)
      .sort()
      .join('_');
    return `subscription_history_${organizationId}_${queryString}`;
  }

  /**
   * Generate cache key for subscription plans
   */
  generatePlansKey(): string {
    return 'subscription_plans_all';
  }

  /**
   * Generate cache key for single plan
   */
  generatePlanKey(planId: string): string {
    return `subscription_plan_${planId}`;
  }

  /**
   * Clear analytics cache
   */
  async clearAnalyticsCache(): Promise<void> {
    try {
      // Clear specific analytics keys
      const analyticsKeys = [
        'subscription_analytics',
        'revenue_analytics',
        'usage_trends',
        'request_analytics',
      ];

      for (const key of analyticsKeys) {
        await this.clearCacheByPattern(key);
      }

      this.logger.log('Analytics cache cleared');
    } catch (error) {
      this.logger.error('Error clearing analytics cache', error);
    }
  }

  /**
   * Clear subscription plans cache
   */
  async clearPlansCache(): Promise<void> {
    try {
      await this.clearCacheByPattern('subscription_plan');
      this.logger.log('Subscription plans cache cleared');
    } catch (error) {
      this.logger.error('Error clearing plans cache', error);
    }
  }

  /**
   * Clear cache by pattern (simplified implementation)
   */
  private async clearCacheByPattern(pattern: string): Promise<void> {
    try {
      // Note: This is a simplified implementation
      // In production, you might want to use Redis pattern matching
      // For now, we'll clear specific known keys
      const store = this.cacheManager.store as any;
      if (store && store.keys) {
        const keys = await store.keys();
        const matchingKeys = keys.filter((key: string) => key.includes(pattern));
        
        for (const key of matchingKeys) {
          await this.cacheManager.del(key);
        }
      }
    } catch (error) {
      this.logger.error(`Error clearing cache by pattern: ${pattern}`, error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<any> {
    try {
      const store = this.cacheManager.store as any;
      if (store && store.keys) {
        const keys = await store.keys();
        const analyticsKeys = keys.filter((key: string) => 
          key.includes('analytics') || 
          key.includes('subscription_') ||
          key.includes('revenue_') ||
          key.includes('usage_')
        );

        return {
          totalKeys: keys.length,
          analyticsKeys: analyticsKeys.length,
          keyPatterns: this.groupKeysByPattern(analyticsKeys),
        };
      }
      
      return { message: 'Cache statistics not available' };
    } catch (error) {
      this.logger.error('Error getting cache statistics', error);
      return { error: 'Failed to get cache statistics' };
    }
  }

  /**
   * Group keys by pattern for statistics
   */
  private groupKeysByPattern(keys: string[]): Record<string, number> {
    const patterns = {
      subscription_analytics: 0,
      revenue_analytics: 0,
      usage_trends: 0,
      request_analytics: 0,
      subscription_plans: 0,
      subscription_history: 0,
      other: 0,
    };

    keys.forEach(key => {
      if (key.includes('subscription_analytics')) {
        patterns.subscription_analytics++;
      } else if (key.includes('revenue_analytics')) {
        patterns.revenue_analytics++;
      } else if (key.includes('usage_trends')) {
        patterns.usage_trends++;
      } else if (key.includes('request_analytics')) {
        patterns.request_analytics++;
      } else if (key.includes('subscription_plan')) {
        patterns.subscription_plans++;
      } else if (key.includes('subscription_history')) {
        patterns.subscription_history++;
      } else {
        patterns.other++;
      }
    });

    return patterns;
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmUpCache(): Promise<void> {
    this.logger.log('Starting cache warm-up process...');
    
    // This would be called periodically to pre-populate frequently accessed data
    // Implementation would depend on your specific caching strategy
    
    this.logger.log('Cache warm-up completed');
  }
}