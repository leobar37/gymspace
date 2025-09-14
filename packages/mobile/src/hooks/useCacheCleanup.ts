import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

/**
 * Hook for selective cache cleanup to optimize memory usage
 */
export const useCacheCleanup = () => {
  const queryClient = useQueryClient();

  /**
   * Remove non-essential queries from cache
   * Keeps session, user, and gym data
   */
  const clearNonEssentialCache = useCallback(() => {
    queryClient.removeQueries({
      predicate: (query) => {
        const key = JSON.stringify(query.queryKey);
        
        // Keep essential queries
        const essentialKeys = ['session', 'gym', 'user', 'currentSession'];
        const isEssential = essentialKeys.some(essential => key.includes(essential));
        
        // Remove non-essential queries older than 2 minutes
        const queryState = query.state;
        const dataUpdatedAt = queryState.dataUpdatedAt;
        const twoMinutesAgo = Date.now() - (2 * 60 * 1000);
        const isOld = dataUpdatedAt < twoMinutesAgo;
        
        // Remove if not essential and old
        return !isEssential && isOld;
      }
    });
  }, [queryClient]);

  /**
   * Clear specific feature cache
   * @param feature - The feature to clear cache for
   */
  const clearFeatureCache = useCallback((
    feature: 'clients' | 'products' | 'contracts' | 'inventory' | 'dashboard'
  ) => {
    queryClient.removeQueries({
      queryKey: [feature]
    });
  }, [queryClient]);

  /**
   * Clear all cache except essential data
   */
  const clearAllExceptEssentials = useCallback(() => {
    const essentialKeys = ['session', 'gym', 'user', 'currentSession'];
    
    queryClient.removeQueries({
      predicate: (query) => {
        const key = JSON.stringify(query.queryKey);
        return !essentialKeys.some(essential => key.includes(essential));
      }
    });
  }, [queryClient]);

  /**
   * Smart cache cleanup based on current tab
   * Keeps cache for current and adjacent tabs
   */
  const smartCleanupForTab = useCallback((
    currentTab: 'index' | 'clients' | 'inventory' | 'contracts' | 'more'
  ) => {
    const tabCacheMap = {
      index: ['dashboard', 'stats'],
      clients: ['clients'],
      inventory: ['products', 'categories', 'sales', 'services'],
      contracts: ['contracts', 'plans'],
      more: ['profile', 'settings']
    };

    // Get features to keep based on current tab
    const featuresToKeep = tabCacheMap[currentTab] || [];
    
    queryClient.removeQueries({
      predicate: (query) => {
        const key = JSON.stringify(query.queryKey);
        
        // Always keep essential queries
        const essentialKeys = ['session', 'gym', 'user', 'currentSession'];
        if (essentialKeys.some(essential => key.includes(essential))) {
          return false;
        }
        
        // Keep queries related to current tab
        if (featuresToKeep.some(feature => key.includes(feature))) {
          return false;
        }
        
        // Remove everything else older than 3 minutes
        const queryState = query.state;
        const dataUpdatedAt = queryState.dataUpdatedAt;
        const threeMinutesAgo = Date.now() - (3 * 60 * 1000);
        
        return dataUpdatedAt < threeMinutesAgo;
      }
    });
  }, [queryClient]);

  /**
   * Get current cache size estimate
   */
  const getCacheStats = useCallback(() => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    return {
      totalQueries: queries.length,
      activeQueries: queries.filter(q => q.state.status === 'success').length,
      staleQueries: queries.filter(q => q.isStale()).length,
      fetchingQueries: queries.filter(q => q.state.fetchStatus === 'fetching').length
    };
  }, [queryClient]);

  return {
    clearNonEssentialCache,
    clearFeatureCache,
    clearAllExceptEssentials,
    smartCleanupForTab,
    getCacheStats
  };
};