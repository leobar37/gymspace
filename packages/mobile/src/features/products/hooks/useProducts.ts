import { useGymSdk } from '@/providers/GymSdkProvider';
import type {
  CreateProductDto,
  CreateServiceDto,
  Product,
  ProductCategory,
  SearchProductsParams,
  UpdateProductDto
} from '@gymspace/sdk';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Query key factories
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters?: SearchProductsParams) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  categories: () => [...productKeys.all, 'categories'] as const,
  lowStock: () => [...productKeys.all, 'low-stock'] as const,
};

// Shared configuration for products list
const PRODUCTS_LIST_CONFIG = {
  page: 1,
  limit: 1000,
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes
} as const;

// Shared query function for fetching all products
const createProductsQueryFn = (sdk: ReturnType<typeof useGymSdk>['sdk']) => {
  return async (): Promise<Product[]> => {
    const response = await sdk.products.searchProducts({ 
      page: PRODUCTS_LIST_CONFIG.page, 
      limit: PRODUCTS_LIST_CONFIG.limit
    });
    return response.data || [];
  };
};

export interface UseProductsOptions {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
}

export function useProducts(options: UseProductsOptions = {}) {
  const { sdk } = useGymSdk();
  const {
    enabled = true,
    staleTime = PRODUCTS_LIST_CONFIG.staleTime,
    gcTime = PRODUCTS_LIST_CONFIG.gcTime,
  } = options;

  return useQuery({
    queryKey: productKeys.all,
    queryFn: createProductsQueryFn(sdk),
    enabled,
    staleTime,
    gcTime,
  });
}

export function useProduct(id: string, options: { enabled?: boolean } = {}) {
  const { sdk } = useGymSdk();
  const { enabled = true } = options;

  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: async (): Promise<Product> => {
      return sdk.products.getProduct(id);
    },
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useProductCategories(options: { enabled?: boolean } = {}) {
  const { sdk } = useGymSdk();
  const { enabled = true } = options;

  return useQuery({
    queryKey: productKeys.categories(),
    queryFn: createCategoriesQueryFn(sdk),
    enabled,
    staleTime: CATEGORIES_CONFIG.staleTime,
    gcTime: CATEGORIES_CONFIG.gcTime,
  });
}

export function useLowStockProducts(threshold: number = 10, options: { enabled?: boolean } = {}) {
  const { sdk } = useGymSdk();
  const { enabled = true } = options;

  return useQuery({
    queryKey: [...productKeys.lowStock(), threshold],
    queryFn: async (): Promise<Product[]> => {
      return sdk.products.getLowStockProducts(threshold);
    },
    enabled,
    staleTime: 2 * 60 * 1000, // Stock changes frequently
    gcTime: 5 * 60 * 1000,
  });
}

export function useCreateProduct() {
  const { sdk } = useGymSdk();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProductDto): Promise<Product> => {
      return sdk.products.createProduct(data);
    },
    onSuccess: () => {
      // Invalidate and refetch product lists
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.lowStock() });
    },
  });
}

export function useCreateService() {
  const { sdk } = useGymSdk();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateServiceDto): Promise<Product> => {
      return sdk.products.createService(data);
    },
    onSuccess: () => {
      // Invalidate and refetch product lists (services are stored as products)
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      // Services don't affect low stock, but invalidate for consistency
      queryClient.invalidateQueries({ queryKey: productKeys.lowStock() });
    },
  });
}

export function useUpdateProduct() {
  const { sdk } = useGymSdk();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProductDto }): Promise<Product> => {
      return sdk.products.updateProduct(id, data);
    },
    onSuccess: (updatedProduct) => {
      // Update the specific product cache
      queryClient.setQueryData(
        productKeys.detail(updatedProduct.id),
        updatedProduct
      );
      
      // Invalidate lists to refetch updated data
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.lowStock() });
    },
  });
}

export function useDeleteProduct() {
  const { sdk } = useGymSdk();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      return sdk.products.deleteProduct(id);
    },
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: productKeys.detail(deletedId) });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.lowStock() });
    },
  });
}

export function useUpdateStock() {
  const { sdk } = useGymSdk();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }): Promise<Product> => {
      return sdk.products.updateStock(id, { quantity });
    },
    onSuccess: (updatedProduct) => {
      // Update specific product cache
      queryClient.setQueryData(
        productKeys.detail(updatedProduct.id),
        updatedProduct
      );
      
      // Invalidate lists to show updated stock
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.lowStock() });
    },
  });
}

// Shared configuration for categories
const CATEGORIES_CONFIG = {
  staleTime: 10 * 60 * 1000, // 10 minutes - categories don't change often
  gcTime: 30 * 60 * 1000,
} as const;

// Shared query function for fetching categories
const createCategoriesQueryFn = (sdk: ReturnType<typeof useGymSdk>['sdk']) => {
  return async (): Promise<ProductCategory[]> => {
    return sdk.products.getCategories();
  };
};

// Prefetch function for products
export function usePrefetchProducts() {
  const { sdk } = useGymSdk();
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.prefetchQuery({
      queryKey: productKeys.all,
      queryFn: createProductsQueryFn(sdk),
      staleTime: PRODUCTS_LIST_CONFIG.staleTime,
    });
  };
}

// Prefetch function for categories
export function usePrefetchCategories() {
  const { sdk } = useGymSdk();
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.prefetchQuery({
      queryKey: productKeys.categories(),
      queryFn: createCategoriesQueryFn(sdk),
      staleTime: CATEGORIES_CONFIG.staleTime,
    });
  };
}

// Re-export filter hook
export { useProductsFilter } from './useProductsFilter';
export type { ProductFilters, UseProductsFilterOptions, UseProductsFilterReturn } from './useProductsFilter';

// Re-export services hook
export { serviceKeys, useServices } from './useServices';
export type { UseServicesOptions } from './useServices';
