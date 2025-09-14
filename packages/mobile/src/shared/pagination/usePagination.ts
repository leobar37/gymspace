import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import type { PaginatedResponseDto } from '@gymspace/sdk';

/**
 * Pagination strategies available
 */
export type PaginationStrategy = 'infinite' | 'standard' | 'cursor';

/**
 * Pagination state interface
 */
export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  isLoadingMore: boolean;
  strategy: PaginationStrategy;
}

/**
 * Options for the usePagination hook
 */
export interface UsePaginationOptions<TData, TParams extends Record<string, any> = {}> {
  /**
   * Unique key for caching
   */
  queryKey: readonly unknown[];
  
  /**
   * Function to fetch paginated data
   */
  queryFn: (params: TParams & { page: number; limit: number }) => Promise<PaginatedResponseDto<TData>>;
  
  /**
   * Initial page number (default: 1)
   */
  initialPage?: number;
  
  /**
   * Items per page (default: 20)
   */
  limit?: number;
  
  /**
   * Pagination strategy (default: 'infinite')
   */
  strategy?: PaginationStrategy;
  
  /**
   * Additional query parameters
   */
  params?: TParams;
  
  /**
   * Whether the query is enabled
   */
  enabled?: boolean;
  
  /**
   * Stale time in milliseconds
   */
  staleTime?: number;
  
  /**
   * Cache time in milliseconds
   */
  gcTime?: number;
  
  /**
   * Keep previous data while fetching new page
   */
  keepPreviousData?: boolean;
  
  /**
   * Prefetch next page for better UX
   */
  prefetchNextPage?: boolean;
  
  /**
   * Callback when data is fetched
   */
  onSuccess?: (data: PaginatedResponseDto<TData>) => void;
  
  /**
   * Callback on error
   */
  onError?: (error: Error) => void;
}

/**
 * Return type for the usePagination hook
 */
export interface UsePaginationResult<TData> {
  // Data
  items: TData[];
  allItems: TData[]; // For infinite scroll
  
  // State
  state: PaginationState;
  
  // Loading states
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  
  // Actions
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (page: number) => void;
  refresh: () => Promise<void>;
  loadMore: () => void; // For infinite scroll
  reset: () => void;
  
  // Utilities
  canGoNext: boolean;
  canGoPrevious: boolean;
  pageNumbers: number[]; // For standard pagination
}

/**
 * Generic pagination hook that works with any paginated API
 */
export function usePagination<TData, TParams extends Record<string, any> = {}>(
  options: UsePaginationOptions<TData, TParams>
): UsePaginationResult<TData> {
  const {
    queryKey,
    queryFn,
    initialPage = 1,
    limit = 20,
    strategy = 'infinite',
    params = {} as TParams,
    enabled = true,
    staleTime = 2 * 60 * 1000, // 2 minutes
    gcTime = 10 * 60 * 1000, // 10 minutes
    keepPreviousData = true,
    prefetchNextPage = true,
    onSuccess,
    onError,
  } = options;

  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const allItemsRef = useRef<TData[]>([]);
  const lastPageRef = useRef(initialPage);
  const loadingTimerRef = useRef<any>();

  // Build query key with pagination params
  const paginatedQueryKey = useMemo(
    () => [...queryKey, { page: currentPage, limit, ...params }],
    [queryKey, currentPage, limit, params]
  );

  // Main query
  const query = useQuery({
    queryKey: paginatedQueryKey,
    queryFn: async () => {
      const result = await queryFn({ ...params, page: currentPage, limit });
      
      // Handle infinite scroll accumulation
      if (strategy === 'infinite') {
        if (currentPage === 1) {
          allItemsRef.current = result.data;
        } else if (currentPage > lastPageRef.current) {
          // Only append if we're moving forward
          allItemsRef.current = [...allItemsRef.current, ...result.data];
        }
        lastPageRef.current = currentPage;
      }
      
      onSuccess?.(result);
      return result;
    },
    enabled,
    staleTime,
    gcTime,
    keepPreviousData: keepPreviousData && strategy === 'standard',
    onError: (error: Error) => {
      onError?.(error);
    },
  });

  // Prefetch next page for better UX
  useEffect(() => {
    if (prefetchNextPage && query.data?.meta.hasNext && strategy === 'standard') {
      const nextPageKey = [...queryKey, { page: currentPage + 1, limit, ...params }];
      queryClient.prefetchQuery({
        queryKey: nextPageKey,
        queryFn: () => queryFn({ ...params, page: currentPage + 1, limit }),
        staleTime,
      });
    }
  }, [currentPage, query.data, prefetchNextPage, strategy, queryClient, queryKey, queryFn, params, limit, staleTime]);

  // Pagination state
  const state: PaginationState = useMemo(() => ({
    page: currentPage,
    limit,
    total: query.data?.meta.total || 0,
    totalPages: query.data?.meta.totalPages || 0,
    hasNextPage: query.data?.meta.hasNext || false,
    hasPreviousPage: query.data?.meta.hasPrevious || false,
    isLoadingMore,
    strategy,
  }), [currentPage, limit, query.data, isLoadingMore, strategy]);

  // Actions
  const nextPage = useCallback(() => {
    if (state.hasNextPage && !query.isFetching) {
      setCurrentPage(prev => prev + 1);
    }
  }, [state.hasNextPage, query.isFetching]);

  const previousPage = useCallback(() => {
    if (state.hasPreviousPage && !query.isFetching) {
      setCurrentPage(prev => Math.max(1, prev - 1));
    }
  }, [state.hasPreviousPage, query.isFetching]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= state.totalPages && !query.isFetching) {
      setCurrentPage(page);
      if (strategy === 'infinite') {
        // Reset accumulated items when jumping to a specific page
        allItemsRef.current = [];
        lastPageRef.current = page;
      }
    }
  }, [state.totalPages, query.isFetching, strategy]);

  const loadMore = useCallback(async () => {
    if (strategy === 'infinite' && state.hasNextPage && !isLoadingMore && !query.isFetching) {
      setIsLoadingMore(true);
      setCurrentPage(prev => prev + 1);
    }
  }, [strategy, state.hasNextPage, isLoadingMore, query.isFetching]);

  // Handle isLoadingMore reset with cleanup
  useEffect(() => {
    if (isLoadingMore && !query.isFetching) {
      loadingTimerRef.current = setTimeout(() => {
        setIsLoadingMore(false);
      }, 100);
    }
    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, [isLoadingMore, query.isFetching]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear refs on unmount
      allItemsRef.current = [];
      lastPageRef.current = initialPage;
      setIsLoadingMore(false);
      // Clear timer if exists
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, [initialPage]);

  const refresh = useCallback(async () => {
    allItemsRef.current = [];
    lastPageRef.current = 1;
    setCurrentPage(1);
    await queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  const reset = useCallback(() => {
    allItemsRef.current = [];
    lastPageRef.current = initialPage;
    setCurrentPage(initialPage);
    setIsLoadingMore(false);
  }, [initialPage]);

  // Generate page numbers for standard pagination
  const pageNumbers = useMemo(() => {
    if (strategy !== 'standard') return [];
    
    const pages: number[] = [];
    const maxVisible = 5;
    const halfVisible = Math.floor(maxVisible / 2);
    
    let start = Math.max(1, currentPage - halfVisible);
    let end = Math.min(state.totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }, [strategy, currentPage, state.totalPages]);

  return {
    // Data
    items: query.data?.data || [],
    allItems: strategy === 'infinite' ? allItemsRef.current : (query.data?.data || []),
    
    // State
    state,
    
    // Loading states
    isLoading: query.isLoading,
    isFetching: query.isFetching || isLoadingMore,
    isError: query.isError,
    error: query.error as Error | null,
    
    // Actions
    nextPage,
    previousPage,
    goToPage,
    refresh,
    loadMore,
    reset,
    
    // Utilities
    canGoNext: state.hasNextPage && !query.isFetching,
    canGoPrevious: state.hasPreviousPage && !query.isFetching,
    pageNumbers,
  };
}

/**
 * Hook specifically for infinite scroll implementation
 */
export function useInfiniteScroll<TData, TParams extends Record<string, any> = {}>(
  options: Omit<UsePaginationOptions<TData, TParams>, 'strategy'>
) {
  return usePagination({
    ...options,
    strategy: 'infinite',
  });
}

/**
 * Hook specifically for standard pagination implementation
 */
export function useStandardPagination<TData, TParams extends Record<string, any> = {}>(
  options: Omit<UsePaginationOptions<TData, TParams>, 'strategy'>
) {
  return usePagination({
    ...options,
    strategy: 'standard',
  });
}