import { useGymSdk } from '@/providers/GymSdkProvider';
import type { CreateProductDto, CreateServiceDto, UpdateProductDto } from '@gymspace/sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useProductsController = () => {
  const queryClient = useQueryClient();
  const { sdk } = useGymSdk();

  const createProduct = useMutation({
    mutationFn: async (data: CreateProductDto) => {
      return sdk.products.createProduct(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const createService = useMutation({
    mutationFn: async (data: CreateServiceDto) => {
      return sdk.products.createService(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProductDto }) => {
      return sdk.products.updateProduct(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      return sdk.products.deleteProduct(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const toggleProductStatus = useMutation({
    mutationFn: async (id: string) => {
      return sdk.products.toggleProductStatus(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const updateStock = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      return sdk.products.updateStock(id, quantity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
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