import { useEffect } from 'react';
import { useClientsController } from '@/features/clients/controllers/clients.controller';
import { usePrefetchProducts, usePrefetchCategories } from '@/features/products/hooks/useProducts';
import { usePrefetchServices } from '@/features/products/hooks/useServices';

/**
 * Component that prefetches critical data in the background
 * without blocking the UI or showing loading states to the user
 */
export const DataPrefetch = () => {
  // Get prefetch functions from controllers/hooks
  const { prefetchClientsList } = useClientsController();
  const prefetchProducts = usePrefetchProducts();
  const prefetchCategories = usePrefetchCategories();
  const prefetchServices = usePrefetchServices();

  useEffect(() => {
    // Prefetch data in the background without awaiting
    // This ensures UI renders immediately while data loads in background
    const prefetchData = async () => {
      try {
        // Run all prefetch operations in parallel
        await Promise.allSettled([
          // Prefetch clients (default: page 1, limit 1000)
          prefetchClientsList(),

          // Prefetch products (default: page 1, limit 1000)
          prefetchProducts(),

          // Prefetch product categories
          prefetchCategories(),

          // Prefetch services
          prefetchServices(),
        ]);
      } catch (error) {
        // Silently fail - prefetching is a best effort operation
        console.log('Prefetch error (non-blocking):', error);
      }
    };

    // Start prefetching after a short delay to prioritize initial render
    const timeoutId = setTimeout(() => {
      prefetchData();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [prefetchClientsList, prefetchProducts, prefetchCategories, prefetchServices]);

  // This component doesn't render anything
  return null;
};
