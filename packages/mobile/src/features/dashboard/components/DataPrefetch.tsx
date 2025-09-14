import { useEffect, useRef } from 'react';
import { useClientsController } from '@/features/clients/controllers/clients.controller';
import { usePrefetchProducts, usePrefetchCategories } from '@/features/products/hooks/useProducts';
import { usePrefetchServices } from '@/features/products/hooks/useServices';
import { usePrefetchStore } from '@/stores/prefetch.store';

/**
 * Component that prefetches critical data in the background
 * without blocking the UI or showing loading states to the user
 * Uses intelligent caching to prevent unnecessary re-fetches
 */
export const DataPrefetch = () => {
  // Get prefetch functions from controllers/hooks
  const { prefetchClientsList } = useClientsController();
  const prefetchProducts = usePrefetchProducts();
  const prefetchCategories = usePrefetchCategories();
  const prefetchServices = usePrefetchServices();
  
  // Get prefetch control from store
  const {
    shouldPrefetch,
    markClientsPrefetched,
    markProductsPrefetched,
    markCategoriesPrefetched,
    markServicesPrefetched,
  } = usePrefetchStore();
  
  const timeoutRef = useRef<any>();

  useEffect(() => {
    const prefetchData = async () => {
      try {
        const promises = [];
        
        // Only prefetch if necessary (not cached or cache expired)
        if (shouldPrefetch('clients')) {
          promises.push(
            prefetchClientsList().then(() => markClientsPrefetched())
          );
        }
        
        if (shouldPrefetch('products')) {
          promises.push(
            prefetchProducts().then(() => markProductsPrefetched())
          );
        }
        
        if (shouldPrefetch('categories')) {
          promises.push(
            prefetchCategories().then(() => markCategoriesPrefetched())
          );
        }
        
        if (shouldPrefetch('services')) {
          promises.push(
            prefetchServices().then(() => markServicesPrefetched())
          );
        }
        
        // Only execute if there's something to prefetch
        if (promises.length > 0) {
          await Promise.allSettled(promises);
        }
      } catch (error) {
        // Silently fail - prefetching is a best effort operation
        console.log('Prefetch error (non-blocking):', error);
      }
    };

    // Start prefetching after a short delay to prioritize initial render
    timeoutRef.current = setTimeout(() => {
      prefetchData();
    }, 500);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []); // Empty dependencies - only run once on mount

  // This component doesn't render anything
  return null;
};
