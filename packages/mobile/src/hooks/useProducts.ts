import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { transformPaginatedResponse, type TransformedPaginatedResponse } from '@/utils/pagination';
import type { 
  Product, 
  ProductCategory,
  SearchProductsParams, 
  CreateProductDto,
  UpdateProductDto
} from '@gymspace/sdk';

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

export interface UseProductsOptions extends SearchProductsParams {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
}

export function useProducts(options: UseProductsOptions = { page: 1, limit: 20 }) {
  const { sdk } = useGymSdk();
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    gcTime = 10 * 60 * 1000, // 10 minutes
    ...searchParams
  } = options;

  return useQuery({
    queryKey: productKeys.list(searchParams),
    queryFn: async (): Promise<TransformedPaginatedResponse<Product>> => {
      const response = await sdk.products.searchProducts(searchParams);
      return transformPaginatedResponse(response);
    },
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
    queryFn: async (): Promise<ProductCategory[]> => {
      return sdk.products.getCategories();
    },
    enabled,
    staleTime: 10 * 60 * 1000, // Categories don't change often
    gcTime: 30 * 60 * 1000,
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