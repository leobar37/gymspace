import type { PaginatedResponseDto } from '@gymspace/sdk';

/**
 * Helper function to transform PaginatedResponseDto to a more convenient format
 * for UI components
 */
export function transformPaginatedResponse<T>(response: PaginatedResponseDto<T>) {
  return {
    items: response.data,
    total: response.meta.total,
    page: response.meta.page,
    limit: response.meta.limit,
    totalPages: response.meta.totalPages,
    hasNextPage: response.meta.hasNext,
    hasPreviousPage: response.meta.hasPrevious,
  };
}

/**
 * Type for the transformed paginated response
 */
export interface TransformedPaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}