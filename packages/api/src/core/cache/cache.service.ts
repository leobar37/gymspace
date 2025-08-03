import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CACHE_TTL } from '@gymspace/shared';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    return await this.cacheManager.get<T>(key);
  }

  /**
   * Set value in cache with optional TTL
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  /**
   * Clear all cache
   */
  async reset(): Promise<void> {
    await this.cacheManager.reset();
  }

  /**
   * Cache user permissions
   */
  async cacheUserPermissions(userId: string, gymId: string, permissions: string[]): Promise<void> {
    const key = this.getUserPermissionsKey(userId, gymId);
    await this.set(key, permissions, CACHE_TTL.USER_PERMISSIONS);
  }

  /**
   * Get cached user permissions
   */
  async getUserPermissions(userId: string, gymId: string): Promise<string[] | undefined> {
    const key = this.getUserPermissionsKey(userId, gymId);
    return await this.get<string[]>(key);
  }

  /**
   * Cache gym data
   */
  async cacheGymData(gymId: string, data: any): Promise<void> {
    const key = this.getGymDataKey(gymId);
    await this.set(key, data, CACHE_TTL.GYM_DATA);
  }

  /**
   * Get cached gym data
   */
  async getGymData(gymId: string): Promise<any | undefined> {
    const key = this.getGymDataKey(gymId);
    return await this.get(key);
  }

  /**
   * Invalidate gym-related cache
   */
  async invalidateGymCache(gymId: string): Promise<void> {
    const patterns = [this.getGymDataKey(gymId), `gym:${gymId}:*`];

    // Note: Pattern deletion might require Redis SCAN command
    // For now, we'll delete specific keys
    for (const pattern of patterns) {
      await this.del(pattern);
    }
  }

  /**
   * Get or set with factory function
   */
  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }

  // Key generators
  private getUserPermissionsKey(userId: string, gymId: string): string {
    return `user:${userId}:gym:${gymId}:permissions`;
  }

  private getGymDataKey(gymId: string): string {
    return `gym:${gymId}:data`;
  }

  getGymClientsKey(gymId: string): string {
    return `gym:${gymId}:clients`;
  }

  getGymContractsKey(gymId: string): string {
    return `gym:${gymId}:contracts`;
  }

  getOrganizationSubscriptionKey(orgId: string): string {
    return `organization:${orgId}:subscription`;
  }
}
