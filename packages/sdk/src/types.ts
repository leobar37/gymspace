export interface GymSpaceConfig {
  baseURL: string;
  apiKey?: string;
  refreshToken?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface RequestOptions {
  gymId?: string;
  headers?: Record<string, string>;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// Legacy alias for compatibility
export type PaginatedResponseDto<T> = PaginatedResponse<T>;

// Import specific types we need from shared
import type { PaginationParams as SharedPaginationParams } from '@gymspace/shared';

// Re-export as PaginationQueryDto for backward compatibility
export type PaginationQueryDto = SharedPaginationParams;

// Re-export shared types
export * from '@gymspace/shared';