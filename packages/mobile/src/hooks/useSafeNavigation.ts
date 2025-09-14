import { useRouter, useSegments } from 'expo-router';
import { useCallback, useMemo } from 'react';

/**
 * Hook for safe navigation that prevents stack overflow
 * and optimizes navigation performance
 */
export const useSafeNavigation = () => {
  const router = useRouter();
  const segments = useSegments();

  // Calculate stack depth
  const stackDepth = useMemo(() => segments.length, [segments]);

  /**
   * Navigate to a path with intelligent stack management
   * @param path - The path to navigate to
   * @param options - Navigation options
   */
  const navigate = useCallback(
    (
      path: string,
      options?: {
        replace?: boolean;
        params?: Record<string, any>;
      }
    ) => {
      const { replace = false, params } = options || {};
      
      // Build path with params if provided
      const fullPath = params
        ? `${path}?${new URLSearchParams(params).toString()}`
        : path;

      // Determine if we should replace based on stack depth or explicit flag
      const shouldReplace = replace || stackDepth > 10;

      if (shouldReplace) {
        router.replace(fullPath as any);
      } else {
        router.push(fullPath as any);
      }
    },
    [router, stackDepth]
  );

  /**
   * Navigate to tabs with replace to prevent stack buildup
   * @param tab - The tab path to navigate to
   */
  const navigateToTab = useCallback(
    (tab: 'index' | 'clients' | 'inventory' | 'contracts' | 'more') => {
      // Always replace when navigating between tabs
      router.replace(`/(app)/(tabs)/${tab}` as any);
    },
    [router]
  );

  /**
   * Navigate within a feature module
   * @param path - The path within the feature
   * @param replace - Whether to replace the current screen
   */
  const navigateWithinFeature = useCallback(
    (path: string, replace = false) => {
      // For within-feature navigation, use normal push unless specified
      if (replace) {
        router.replace(path as any);
      } else {
        router.push(path as any);
      }
    },
    [router]
  );

  /**
   * Go back safely
   */
  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // Fallback to home if can't go back
      router.replace('/(app)/(tabs)/index' as any);
    }
  }, [router]);

  /**
   * Reset navigation stack and go to a specific route
   * @param path - The path to navigate to after reset
   */
  const resetAndNavigate = useCallback(
    (path: string) => {
      // This replaces the entire stack with the new route
      router.replace(path as any);
    },
    [router]
  );

  return {
    navigate,
    navigateToTab,
    navigateWithinFeature,
    goBack,
    resetAndNavigate,
    stackDepth,
    segments,
  };
};