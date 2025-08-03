# Pagination

The GymSpace SDK provides consistent pagination across all list endpoints using a standardized format.

## Pagination Response Format

```typescript
interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

interface PaginationMeta {
  total: number;      // Total number of items
  page: number;       // Current page (1-based)
  limit: number;      // Items per page
  totalPages: number; // Total number of pages
  hasNext: boolean;   // Whether there's a next page
  hasPrev: boolean;   // Whether there's a previous page
}
```

## Basic Pagination

```typescript
// Basic pagination parameters
const { data: members, meta } = await sdk.members.list({
  page: 1,      // Page number (1-based)
  limit: 20     // Items per page (default: 20, max: 100)
});

console.log(`Page ${meta.page} of ${meta.totalPages}`);
console.log(`Showing ${data.length} of ${meta.total} total items`);
```

## Cursor-Based Pagination

Some endpoints support cursor-based pagination for better performance with large datasets:

```typescript
// Initial request
const firstPage = await sdk.activities.list({
  limit: 50,
  cursor: null
});

// Get next page using cursor
const nextPage = await sdk.activities.list({
  limit: 50,
  cursor: firstPage.meta.nextCursor
});

// Continue until no more pages
let cursor = null;
let allActivities = [];

do {
  const response = await sdk.activities.list({
    limit: 50,
    cursor
  });
  
  allActivities = [...allActivities, ...response.data];
  cursor = response.meta.nextCursor;
} while (cursor);
```

## Sorting and Ordering

```typescript
// Sort by single field
const newest = await sdk.members.list({
  page: 1,
  limit: 20,
  orderBy: 'createdAt',
  order: 'desc'  // 'asc' or 'desc'
});

// Sort by multiple fields (where supported)
const sorted = await sdk.contracts.list({
  page: 1,
  limit: 20,
  orderBy: ['status', 'startDate'],
  order: ['asc', 'desc']
});
```

## Filtering with Pagination

```typescript
// Combine filters with pagination
const activeMembers = await sdk.members.list({
  page: 1,
  limit: 20,
  filters: {
    status: 'active',
    joinedAfter: new Date('2024-01-01')
  },
  orderBy: 'joinedAt',
  order: 'desc'
});

// Search with pagination
const searchResults = await sdk.members.search({
  query: 'john',
  page: 2,
  limit: 10,
  filters: {
    status: ['active', 'inactive']
  }
});
```

## Pagination Helpers

The SDK provides helper methods for common pagination patterns:

```typescript
// Get all items (auto-pagination)
const allMembers = await sdk.members.listAll({
  filters: { status: 'active' },
  batchSize: 100  // Items per request
});

// Iterate through pages
await sdk.members.forEachPage({
  filters: { status: 'active' },
  async onPage(members, meta) {
    console.log(`Processing page ${meta.page}`);
    for (const member of members) {
      await processMember(member);
    }
  }
});

// Stream results
const stream = sdk.members.stream({
  filters: { status: 'active' },
  batchSize: 50
});

for await (const member of stream) {
  await processMember(member);
}
```

## Custom Page Navigation

```typescript
class PaginationHelper<T> {
  constructor(
    private fetchFn: (params: any) => Promise<PaginatedResponse<T>>,
    private params: any = {}
  ) {}

  async firstPage(limit = 20) {
    return this.fetchFn({ ...this.params, page: 1, limit });
  }

  async lastPage(limit = 20) {
    const first = await this.firstPage(1);
    return this.fetchFn({ 
      ...this.params, 
      page: first.meta.totalPages, 
      limit 
    });
  }

  async nextPage(current: PaginatedResponse<T>) {
    if (!current.meta.hasNext) return null;
    return this.fetchFn({ 
      ...this.params, 
      page: current.meta.page + 1, 
      limit: current.meta.limit 
    });
  }

  async prevPage(current: PaginatedResponse<T>) {
    if (!current.meta.hasPrev) return null;
    return this.fetchFn({ 
      ...this.params, 
      page: current.meta.page - 1, 
      limit: current.meta.limit 
    });
  }

  async goToPage(page: number, limit = 20) {
    return this.fetchFn({ ...this.params, page, limit });
  }
}

// Usage
const helper = new PaginationHelper(
  (params) => sdk.members.list(params),
  { status: 'active' }
);

const firstPage = await helper.firstPage();
const nextPage = await helper.nextPage(firstPage);
const page5 = await helper.goToPage(5);
```

## Performance Considerations

```typescript
// Use appropriate page sizes
// Small pages for real-time UI updates
const realtimeUpdates = await sdk.activities.list({
  page: 1,
  limit: 10
});

// Larger pages for batch processing
const batchData = await sdk.members.list({
  page: 1,
  limit: 100  // Maximum allowed
});

// Use cursor pagination for large datasets
const largeDataset = await sdk.logs.list({
  cursor: lastCursor,
  limit: 50
});

// Pre-fetch next page for better UX
const currentPage = await sdk.members.list({ page: 1, limit: 20 });
const nextPagePromise = sdk.members.list({ page: 2, limit: 20 });
```

## Error Handling

```typescript
try {
  const result = await sdk.members.list({
    page: 999999,  // Non-existent page
    limit: 20
  });
} catch (error) {
  if (error.code === 'PAGE_OUT_OF_RANGE') {
    console.error('Requested page does not exist');
    // Fetch last page instead
    const lastPage = await sdk.members.list({
      page: error.data.totalPages,
      limit: 20
    });
  }
}

// Handle invalid limit
try {
  const result = await sdk.members.list({
    page: 1,
    limit: 1000  // Exceeds maximum
  });
} catch (error) {
  if (error.code === 'INVALID_LIMIT') {
    console.error(`Limit must be between 1 and ${error.data.maxLimit}`);
  }
}
```

## Pagination State Management

```typescript
// React example
function usePagination<T>(
  fetchFn: (params: any) => Promise<PaginatedResponse<T>>,
  initialParams = {}
) {
  const [data, setData] = useState<T[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPage = async (page: number, limit = 20) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetchFn({
        ...initialParams,
        page,
        limit
      });
      
      setData(response.data);
      setMeta(response.meta);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const nextPage = () => {
    if (meta?.hasNext) {
      fetchPage(meta.page + 1, meta.limit);
    }
  };

  const prevPage = () => {
    if (meta?.hasPrev) {
      fetchPage(meta.page - 1, meta.limit);
    }
  };

  return {
    data,
    meta,
    loading,
    error,
    fetchPage,
    nextPage,
    prevPage
  };
}

// Usage in component
const { data, meta, loading, nextPage, prevPage } = usePagination(
  (params) => sdk.members.list(params),
  { status: 'active' }
);
```