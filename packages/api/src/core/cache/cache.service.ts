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

  /**
   * Cache validated token with user data
   */
  async cacheTokenValidation(
    token: string,
    user: any,
    ttl: number = CACHE_TTL.REPORTS,
  ): Promise<void> {
    const key = this.getTokenValidationKey(token);
    await this.set(key, user, ttl);
  }

  /**
   * Get cached token validation
   */
  async getTokenValidation(token: string): Promise<any | undefined> {
    const key = this.getTokenValidationKey(token);
    return await this.get(key);
  }

  /**
   * Cache gym context for user
   */
  async cacheGymContext(
    gymId: string,
    userId: string,
    gymContext: any,
    ttl: number = CACHE_TTL.GYM_DATA,
  ): Promise<void> {
    const key = this.getGymContextKey(gymId, userId);
    await this.set(key, gymContext, ttl);
  }

  /**
   * Get cached gym context
   */
  async getGymContext(gymId: string, userId: string): Promise<any | undefined> {
    const key = this.getGymContextKey(gymId, userId);
    return await this.get(key);
  }

  /**
   * Cache default gym for user
   */
  async cacheDefaultGym(userId: string, gym: any, ttl: number = CACHE_TTL.GYM_DATA): Promise<void> {
    const key = this.getDefaultGymKey(userId);
    await this.set(key, gym, ttl);
  }

  /**
   * Get cached default gym
   */
  async getDefaultGym(userId: string): Promise<any | undefined> {
    const key = this.getDefaultGymKey(userId);
    return await this.get(key);
  }

  /**
   * Invalidate all auth-related cache for a user
   */
  async invalidateUserAuthCache(userId: string): Promise<void> {
    const defaultGymKey = this.getDefaultGymKey(userId);
    await this.del(defaultGymKey);

    // Note: For token and gym context invalidation, we'd need to track active tokens/gyms
    // This could be implemented with a user-to-tokens mapping if needed
  }

  /**
   * Blacklist a token (useful for logout)
   */
  async blacklistToken(token: string, ttl: number = 86400): Promise<void> {
    const key = this.getBlacklistKey(token);
    await this.set(key, true, ttl);
  }

  /**
   * Check if token is blacklisted
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const key = this.getBlacklistKey(token);
    const blacklisted = await this.get<boolean>(key);
    return blacklisted === true;
  }

  // Additional key generators for auth
  private getTokenValidationKey(token: string): string {
    // Use a hash of the token to avoid storing sensitive data in keys
    const tokenHash = token.substring(token.length - 20); // Use last 20 chars as identifier
    return `auth:token:${tokenHash}:validation`;
  }

  private getGymContextKey(gymId: string, userId: string): string {
    return `auth:gym:${gymId}:user:${userId}:context`;
  }

  private getDefaultGymKey(userId: string): string {
    return `auth:user:${userId}:default-gym`;
  }

  private getBlacklistKey(token: string): string {
    const tokenHash = token.substring(token.length - 20);
    return `auth:blacklist:${tokenHash}`;
  }
}
