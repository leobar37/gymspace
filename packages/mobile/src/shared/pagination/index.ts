/**
 * Pagination utilities for the mobile app
 * 
 * This module provides a complete pagination solution with:
 * - Generic pagination hook that works with any API
 * - Support for infinite scroll and standard pagination
 * - UI components for pagination controls
 * - Performance optimizations
 * - TypeScript support
 */

export {
  usePagination,
  useInfiniteScroll,
  useStandardPagination,
  type UsePaginationOptions,
  type UsePaginationResult,
  type PaginationState,
  type PaginationStrategy,
} from './usePagination';

export {
  PaginationControls,
  type PaginationControlsProps,
} from './PaginationControls';

export {
  InfiniteScrollList,
  type InfiniteScrollListProps,
} from './InfiniteScrollList';

// Re-export pagination types from SDK for convenience
export type { PaginatedResponseDto, PaginationQueryDto } from '@gymspace/sdk';