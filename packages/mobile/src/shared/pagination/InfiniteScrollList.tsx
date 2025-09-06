import { HStack } from '@/components/ui/hstack';
import { Spinner } from '@/components/ui/spinner';
import { Text as UIText } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  FlatListProps,
  ListRenderItem,
  RefreshControl,
  View
} from 'react-native';
import type { UsePaginationResult } from './usePagination';

/**
 * Props for InfiniteScrollList component
 */
export interface InfiniteScrollListProps<T> extends Omit<FlatListProps<T>, 'data' | 'renderItem'> {
  /**
   * Pagination result from usePagination hook
   */
  pagination: UsePaginationResult<T>;

  /**
   * Function to render each item
   */
  renderItem: ListRenderItem<T>;

  /**
   * Custom loading component for initial load
   */
  loadingComponent?: React.ReactNode;

  /**
   * Custom empty state component
   */
  emptyComponent?: React.ReactNode;

  /**
   * Custom error component
   */
  errorComponent?: React.ReactNode;

  /**
   * Custom footer loading component
   */
  footerLoadingComponent?: React.ReactNode;

  /**
   * Threshold for triggering load more (0-1, default 0.3)
   */
  onEndReachedThreshold?: number;

  /**
   * Whether to show refresh control
   */
  enableRefresh?: boolean;

  /**
   * Custom refresh control tint color
   */
  refreshTintColor?: string;

  /**
   * Performance optimizations
   */
  performanceConfig?: {
    maxToRenderPerBatch?: number;
    windowSize?: number;
    initialNumToRender?: number;
    removeClippedSubviews?: boolean;
  };
}

/**
 * Reusable infinite scroll list component
 */
export function InfiniteScrollList<T>({
  pagination,
  renderItem,
  loadingComponent,
  emptyComponent,
  errorComponent,
  footerLoadingComponent,
  onEndReachedThreshold = 0.3,
  enableRefresh = true,
  refreshTintColor = '#3B82F6',
  performanceConfig = {},
  ListHeaderComponent,
  ListFooterComponent,
  contentContainerStyle,
  ...flatListProps
}: InfiniteScrollListProps<T>) {
  const { allItems, state, isLoading, isFetching, isError, error, loadMore, refresh } = pagination;

  // Default performance settings
  const performanceSettings = useMemo(
    () => ({
      maxToRenderPerBatch: performanceConfig.maxToRenderPerBatch || 10,
      windowSize: performanceConfig.windowSize || 10,
      initialNumToRender: performanceConfig.initialNumToRender || 10,
      removeClippedSubviews: performanceConfig.removeClippedSubviews ?? true,
    }),
    [performanceConfig],
  );

  // Handle end reached for infinite scroll
  const handleEndReached = useCallback(() => {
    if (state.strategy === 'infinite' && !state.isLoadingMore && state.hasNextPage) {
      loadMore();
    }
  }, [state.strategy, state.isLoadingMore, state.hasNextPage, loadMore]);

  // Render footer with loading indicator
  const renderFooter = useCallback(() => {
    if (ListFooterComponent) {
      return (
        <>
          {ListFooterComponent}
          {state.isLoadingMore && (footerLoadingComponent || <DefaultFooterLoading />)}
        </>
      );
    }

    if (state.isLoadingMore) {
      return footerLoadingComponent || <DefaultFooterLoading />;
    }

    if (!state.hasNextPage && allItems.length > 0) {
      return <DefaultEndOfList total={state.total} />;
    }

    return null;
  }, [
    ListFooterComponent,
    state.isLoadingMore,
    state.hasNextPage,
    state.total,
    allItems.length,
    footerLoadingComponent,
  ]);

  // Render empty state
  const renderEmptyState = useCallback(() => {
    // Show loading component if initial loading OR if fetching with no items yet
    if (isLoading || (isFetching && allItems.length === 0)) {
      return loadingComponent || <DefaultLoadingComponent />;
    }

    if (isError) {
      return errorComponent || <DefaultErrorComponent error={error} onRetry={refresh} />;
    }

    return emptyComponent || <DefaultEmptyComponent />;
  }, [
    isLoading,
    isFetching,
    allItems.length,
    isError,
    error,
    loadingComponent,
    errorComponent,
    emptyComponent,
    refresh,
  ]);

  // Content container style with defaults
  const containerStyle = useMemo(
    () => [{ flexGrow: allItems.length === 0 ? 1 : undefined }, contentContainerStyle],
    [allItems.length, contentContainerStyle],
  );

  return (
    <FlatList<T>
      data={allItems}
      renderItem={renderItem}
      keyExtractor={(item, index) => {
        // Try to use id if available, otherwise use index
        return (item as any).id || String(index);
      }}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmptyState}
      contentContainerStyle={containerStyle}
      onEndReached={handleEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      refreshControl={
        enableRefresh ? (
          <RefreshControl
            refreshing={isFetching && !state.isLoadingMore && allItems.length > 0}
            onRefresh={refresh}
            tintColor={refreshTintColor}
          />
        ) : undefined
      }
      showsVerticalScrollIndicator={false}
      {...performanceSettings}
      {...flatListProps}
    />
  );
}

// Default components
function DefaultFooterLoading() {
  return (
    <View className="py-4 items-center">
      <HStack space="sm" className="items-center">
        <Spinner size="small" />
        <UIText className="text-gray-600 text-sm">Cargando más...</UIText>
      </HStack>
    </View>
  );
}

function DefaultEndOfList({ total }: { total: number }) {
  return (
    <View className="py-4 items-center">
      <UIText className="text-gray-500 text-sm">
        {total > 0 ? `${total} elementos en total` : 'No hay más elementos'}
      </UIText>
    </View>
  );
}

function DefaultLoadingComponent() {
  return (
    <View className="flex-1 items-center justify-center py-12">
      <VStack space="md" className="items-center">
        <Spinner size="large" />
        <UIText className="text-gray-600">Cargando...</UIText>
      </VStack>
    </View>
  );
}

function DefaultEmptyComponent() {
  return (
    <View className="flex-1 items-center justify-center py-12">
      <VStack space="sm" className="items-center">
        <UIText className="text-lg font-medium text-gray-900">No hay elementos</UIText>
        <UIText className="text-gray-600 text-center">
          No se encontraron elementos para mostrar
        </UIText>
      </VStack>
    </View>
  );
}

function DefaultErrorComponent({ error, onRetry }: { error: Error | null; onRetry: () => void }) {
  return (
    <View className="flex-1 items-center justify-center py-12">
      <VStack space="md" className="items-center px-8">
        <UIText className="text-lg font-medium text-red-600">Error al cargar</UIText>
        <UIText className="text-gray-600 text-center">
          {error?.message || 'Ocurrió un error al cargar los datos'}
        </UIText>
        <Pressable onPress={onRetry} className="px-4 py-2 bg-blue-500 rounded-lg">
          <UIText className="text-white font-medium">Reintentar</UIText>
        </Pressable>
      </VStack>
    </View>
  );
}

// Import Pressable if not already imported
import { Pressable } from '@/components/ui/pressable';
