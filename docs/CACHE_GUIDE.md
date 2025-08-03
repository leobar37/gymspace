# TanStack Query v5 Cache Configuration Guide

## Overview

This guide explains the cache configuration implemented for GymSpace mobile app using @tanstack/react-query v5.

## Key Changes in v5

1. **`cacheTime` → `gcTime`**: The `cacheTime` option has been renamed to `gcTime` (Garbage Collection Time)
2. **Better defaults**: More sensible default values for optimal performance
3. **Enhanced background refetching**: Improved control over when data refetches

## Current Configuration

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Network retry configuration
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch configuration
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
      
      // Cache configuration (v5 best practices)
      staleTime: 2 * 60 * 1000,    // 2 minutes - data is fresh
      gcTime: 10 * 60 * 1000,      // 10 minutes - garbage collection
      
      // Background refetch
      refetchInterval: false,
      refetchIntervalInBackground: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
```

## Understanding Cache Behavior

### staleTime (2 minutes)
- **Purpose**: Duration for which data is considered "fresh"
- **Behavior**: 
  - Fresh data = no network requests, served from cache
  - Stale data = served from cache + background refetch triggered
- **Best for**: Frequently accessed data that changes occasionally

### gcTime (10 minutes)
- **Purpose**: How long to keep unused data in cache before garbage collection
- **Behavior**: 
  - After all components using a query unmount
  - Data remains in cache for gcTime duration
  - If query is used again within gcTime, instant cache hit
- **Best for**: Preventing unnecessary refetches when navigating between screens

## Optimization Strategies

### 1. Query Keys Factory Pattern

```typescript
export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
  gyms: () => [...authKeys.all, 'gyms'] as const,
};
```

Benefits:
- Type-safe query keys
- Easy invalidation of related queries
- Consistent key structure

### 2. Per-Query Optimization

Override defaults for specific data types:

```typescript
// User data - changes less frequently
useQuery({
  queryKey: authKeys.user(),
  queryFn: fetchUser,
  staleTime: 5 * 60 * 1000,  // 5 minutes
  gcTime: 30 * 60 * 1000,     // 30 minutes
});

// Real-time data - changes frequently
useQuery({
  queryKey: ['notifications'],
  queryFn: fetchNotifications,
  staleTime: 30 * 1000,       // 30 seconds
  gcTime: 5 * 60 * 1000,      // 5 minutes
});
```

### 3. Cache Invalidation Patterns

```typescript
// Invalidate specific query
queryClient.invalidateQueries({ queryKey: authKeys.user() });

// Invalidate all auth queries
queryClient.invalidateQueries({ queryKey: authKeys.all });

// Remove queries from cache
queryClient.removeQueries({ queryKey: authKeys.all });

// Clear entire cache
queryClient.clear();
```

### 4. Optimistic Updates

```typescript
const updateUserMutation = useMutation({
  mutationFn: updateUser,
  onMutate: async (newData) => {
    // Cancel in-flight queries
    await queryClient.cancelQueries({ queryKey: authKeys.user() });
    
    // Save current data
    const previousData = queryClient.getQueryData(authKeys.user());
    
    // Optimistically update
    queryClient.setQueryData(authKeys.user(), newData);
    
    return { previousData };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(authKeys.user(), context.previousData);
  },
  onSettled: () => {
    // Refetch after mutation
    queryClient.invalidateQueries({ queryKey: authKeys.user() });
  },
});
```

## Best Practices

1. **gcTime > staleTime**: Always set gcTime higher than staleTime for better UX
2. **Categorize data freshness**:
   - Static data: Long staleTime (10-30 minutes)
   - User data: Medium staleTime (2-5 minutes)  
   - Real-time data: Short staleTime (30-60 seconds)
3. **Use query key factories**: Maintain consistent, type-safe query keys
4. **Prefetch predictable navigation**: Use `queryClient.prefetchQuery` for better perceived performance
5. **Handle errors gracefully**: Implement proper error boundaries and retry logic

## Performance Tips

1. **Reduce unnecessary refetches**: Set appropriate staleTime
2. **Prevent memory leaks**: Use reasonable gcTime values
3. **Batch invalidations**: Invalidate related queries together
4. **Use enabled option**: Conditionally fetch based on dependencies
5. **Implement infinite queries**: For paginated lists to cache pages

## Common Patterns

### Authentication Flow
```typescript
// On login success
await queryClient.invalidateQueries({ queryKey: authKeys.all });

// On logout
queryClient.removeQueries({ queryKey: authKeys.all });
queryClient.clear();
```

### Navigation Prefetching
```typescript
// Before navigating to user profile
await queryClient.prefetchQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUserProfile(userId),
});
```

### Dependent Queries
```typescript
const userQuery = useQuery({ queryKey: ['user'], queryFn: fetchUser });
const postsQuery = useQuery({
  queryKey: ['posts', userQuery.data?.id],
  queryFn: () => fetchUserPosts(userQuery.data.id),
  enabled: !!userQuery.data?.id,
});
```