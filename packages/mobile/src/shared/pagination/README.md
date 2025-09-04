# Pagination System Documentation

## Overview

This pagination system provides a comprehensive, reusable solution for handling paginated data in the mobile app. It supports both infinite scroll and standard pagination modes, with full TypeScript support and performance optimizations.

## Features

- 🚀 **Generic Hook**: Works with any paginated API that follows the standard format
- ♾️ **Infinite Scroll**: Seamless loading of more content as users scroll
- 📄 **Standard Pagination**: Traditional page-based navigation
- 🎨 **UI Components**: Pre-built, customizable pagination controls
- ⚡ **Performance**: Optimized with caching, prefetching, and virtualization
- 📱 **Mobile-First**: Designed specifically for React Native
- 🔄 **State Management**: Integrated with TanStack Query
- 🎯 **TypeScript**: Full type safety

## Installation

The pagination system is already installed in the mobile app. Just import from `@/shared/pagination`.

## Basic Usage

### 1. Infinite Scroll

```typescript
import { useInfiniteScroll, InfiniteScrollList } from '@/shared/pagination';
import { useGymSdk } from '@/providers/GymSdkProvider';

function MyListScreen() {
  const { sdk } = useGymSdk();
  
  const pagination = useInfiniteScroll({
    queryKey: ['items', 'list'],
    queryFn: async (params) => {
      return sdk.items.search(params);
    },
    limit: 20,
  });

  return (
    <InfiniteScrollList
      pagination={pagination}
      renderItem={({ item }) => <ItemCard item={item} />}
    />
  );
}
```

### 2. Standard Pagination

```typescript
import { useStandardPagination, PaginationControls } from '@/shared/pagination';

function MyTableScreen() {
  const { sdk } = useGymSdk();
  
  const pagination = useStandardPagination({
    queryKey: ['items', 'table'],
    queryFn: async (params) => {
      return sdk.items.search(params);
    },
    limit: 10,
  });

  return (
    <View>
      <FlatList
        data={pagination.items}
        renderItem={({ item }) => <ItemRow item={item} />}
      />
      <PaginationControls
        state={pagination.state}
        onNextPage={pagination.nextPage}
        onPreviousPage={pagination.previousPage}
        onGoToPage={pagination.goToPage}
        pageNumbers={pagination.pageNumbers}
        variant="full"
      />
    </View>
  );
}
```

### 3. With Filters and Search

```typescript
function FilteredListScreen() {
  const { sdk } = useGymSdk();
  const [filters, setFilters] = useState({});
  const [search, setSearch] = useState('');

  const pagination = useInfiniteScroll({
    queryKey: ['items', 'filtered', filters, search],
    queryFn: async (params) => {
      return sdk.items.search({
        ...params,
        ...filters,
        search,
      });
    },
    limit: 20,
  });

  // When filters change, reset pagination
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    pagination.reset();
  };

  return (
    <InfiniteScrollList
      pagination={pagination}
      renderItem={({ item }) => <ItemCard item={item} />}
    />
  );
}
```

## API Reference

### `usePagination` Hook

Main hook that handles all pagination logic.

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `queryKey` | `readonly unknown[]` | Required | Unique key for caching |
| `queryFn` | `(params) => Promise<PaginatedResponseDto<T>>` | Required | Function to fetch data |
| `initialPage` | `number` | `1` | Starting page number |
| `limit` | `number` | `20` | Items per page |
| `strategy` | `'infinite' \| 'standard'` | `'infinite'` | Pagination type |
| `params` | `object` | `{}` | Additional query parameters |
| `enabled` | `boolean` | `true` | Enable/disable the query |
| `staleTime` | `number` | `2 * 60 * 1000` | Cache stale time (ms) |
| `gcTime` | `number` | `10 * 60 * 1000` | Garbage collection time (ms) |
| `keepPreviousData` | `boolean` | `true` | Keep data while fetching |
| `prefetchNextPage` | `boolean` | `true` | Prefetch next page |

#### Returns

| Property | Type | Description |
|----------|------|-------------|
| `items` | `T[]` | Current page items |
| `allItems` | `T[]` | All loaded items (infinite scroll) |
| `state` | `PaginationState` | Pagination state object |
| `isLoading` | `boolean` | Initial loading state |
| `isFetching` | `boolean` | Fetching state |
| `isError` | `boolean` | Error state |
| `error` | `Error \| null` | Error object |
| `nextPage` | `() => void` | Go to next page |
| `previousPage` | `() => void` | Go to previous page |
| `goToPage` | `(page: number) => void` | Go to specific page |
| `refresh` | `() => Promise<void>` | Refresh data |
| `loadMore` | `() => void` | Load more (infinite) |
| `reset` | `() => void` | Reset pagination |
| `canGoNext` | `boolean` | Can navigate forward |
| `canGoPrevious` | `boolean` | Can navigate backward |
| `pageNumbers` | `number[]` | Page numbers for display |

### `InfiniteScrollList` Component

Pre-configured FlatList with infinite scroll support.

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `pagination` | `UsePaginationResult<T>` | Result from pagination hook |
| `renderItem` | `ListRenderItem<T>` | Item renderer function |
| `loadingComponent` | `ReactNode` | Custom loading UI |
| `emptyComponent` | `ReactNode` | Custom empty state |
| `errorComponent` | `ReactNode` | Custom error UI |
| `footerLoadingComponent` | `ReactNode` | Loading indicator for more items |
| `onEndReachedThreshold` | `number` | Trigger threshold (0-1) |
| `enableRefresh` | `boolean` | Enable pull-to-refresh |
| `performanceConfig` | `object` | Performance settings |

### `PaginationControls` Component

UI controls for standard pagination.

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `state` | `PaginationState` | Pagination state |
| `onNextPage` | `() => void` | Next page handler |
| `onPreviousPage` | `() => void` | Previous page handler |
| `onGoToPage` | `(page: number) => void` | Page navigation handler |
| `pageNumbers` | `number[]` | Page numbers to display |
| `isFetching` | `boolean` | Loading state |
| `variant` | `'simple' \| 'full' \| 'compact'` | Control style |
| `showInfo` | `boolean` | Show page info |

## Performance Considerations

### 1. Caching Strategy

- Results are cached by query key
- Stale time prevents unnecessary refetches
- Garbage collection cleans up unused data

### 2. Prefetching

- Next page is prefetched for instant navigation
- Reduces perceived loading time

### 3. Virtualization

- FlatList virtualization for large lists
- Configurable window size and batch rendering

### 4. Optimization Tips

```typescript
// Optimize for large lists
<InfiniteScrollList
  pagination={pagination}
  renderItem={renderItem}
  performanceConfig={{
    maxToRenderPerBatch: 10,    // Items per batch
    windowSize: 10,              // Viewport multiplier
    initialNumToRender: 8,       // Initial items
    removeClippedSubviews: true, // Remove off-screen views
  }}
/>
```

## Best Practices

1. **Use Stable Query Keys**: Include all dependencies in the query key
2. **Reset on Filter Changes**: Call `pagination.reset()` when filters change
3. **Handle Loading States**: Show appropriate UI for loading/error states
4. **Optimize Render Functions**: Memoize item renderers with `useCallback`
5. **Set Appropriate Limits**: Balance between performance and UX (10-30 items)
6. **Use Infinite Scroll for Mobile**: Better UX on mobile devices
7. **Standard Pagination for Tables**: Better for desktop/tablet views

## Migration Guide

To migrate existing components to use the new pagination system:

1. Replace custom pagination logic with `usePagination` hook
2. Update API calls to return `PaginatedResponseDto` format
3. Replace custom UI with provided components
4. Update state management to use hook results

## Example: Complete Implementation

See `/app/inventory/sales-history.tsx` for a complete implementation with:
- Infinite scroll
- Filters and search
- Mode switching (infinite/standard)
- Performance optimizations
- Error handling
- Empty states

## Troubleshooting

### Common Issues

1. **Data not updating**: Check query key includes all dependencies
2. **Duplicate requests**: Ensure `enabled` is properly controlled
3. **Performance issues**: Adjust `performanceConfig` settings
4. **Memory leaks**: Check `gcTime` and cleanup in components

### Debug Mode

```typescript
const pagination = usePagination({
  // ... options
  onSuccess: (data) => console.log('Fetched:', data),
  onError: (error) => console.error('Error:', error),
});
```