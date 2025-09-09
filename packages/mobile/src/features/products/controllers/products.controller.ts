import { useGymSdk } from '@/providers/GymSdkProvider';
import type { CreateProductDto, CreateServiceDto, UpdateProductDto, UpdateStockDto } from '@gymspace/sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productKeys } from '../hooks/useProducts';

export const useProductsController = () => {
  const queryClient = useQueryClient();
  const { sdk } = useGymSdk();

  const createProduct = useMutation({
    mutationFn: async (data: CreateProductDto) => {
      return sdk.products.createProduct(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.lowStock() });
    },
  });

  const createService = useMutation({
    mutationFn: async (data: CreateServiceDto) => {
      return sdk.products.createService(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.lowStock() });
    },
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProductDto }) => {
      return sdk.products.updateProduct(id, data);
    },
    onSuccess: (updatedProduct) => {
      // Update the specific product in cache
      queryClient.setQueryData(productKeys.detail(updatedProduct.id), updatedProduct);
      // Invalidate lists to show updated data
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.lowStock() });
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      return sdk.products.deleteProduct(id);
    },
    onSuccess: (_, deletedId) => {
      // Remove the specific product from cache
      queryClient.removeQueries({ queryKey: productKeys.detail(deletedId) });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.lowStock() });
    },
  });

  const toggleProductStatus = useMutation({
    mutationFn: async (id: string) => {
      return sdk.products.toggleProductStatus(id);
    },
    onSuccess: (updatedProduct) => {
      // Update the specific product in cache
      queryClient.setQueryData(productKeys.detail(updatedProduct.id), updatedProduct);
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.lowStock() });
    },
  });

  const updateStock = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateStockDto }) => {
      return sdk.products.updateStock(id, data);
    },
    onSuccess: (updatedProduct) => {
      // Update the specific product in cache
      queryClient.setQueryData(productKeys.detail(updatedProduct.id), updatedProduct);
      // Invalidate lists and low stock queries
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.lowStock() });
    },
  });

  return {
    createProduct,
    createService,
    updateProduct,
    deleteProduct,
    toggleProductStatus,
    updateStock,
  };
};