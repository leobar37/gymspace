import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { ProductCategory, CreateProductCategoryDto, UpdateProductCategoryDto } from '@gymspace/sdk';

// Query keys
export const categoriesKeys = {
  all: ['categories'] as const,
  lists: () => [...categoriesKeys.all, 'list'] as const,
  list: () => [...categoriesKeys.lists()] as const,
  details: () => [...categoriesKeys.all, 'detail'] as const,
  detail: (id: string) => [...categoriesKeys.details(), id] as const,
};

// Types
export interface CategoryFormData {
  name: string;
  description?: string;
  color?: string;
}

export const useCategoriesController = () => {
  const { sdk } = useGymSdk();
  const queryClient = useQueryClient();

  // Get categories list
  const useCategoriesList = () => {
    return useQuery({
      queryKey: categoriesKeys.list(),
      queryFn: async () => {
        const response = await sdk.products.getCategories();
        return response;
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  };

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const createData: CreateProductCategoryDto = {
        name: data.name,
        description: data.description,
        color: data.color,
      };
      return await sdk.products.createCategory(createData);
    },
    onSuccess: () => {
      // Invalidate and refetch categories list
      queryClient.invalidateQueries({ queryKey: categoriesKeys.lists() });
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CategoryFormData }) => {
      const updateData: UpdateProductCategoryDto = {
        name: data.name,
        description: data.description,
        color: data.color,
      };
      return await sdk.products.updateCategory(id, updateData);
    },
    onSuccess: (_, variables) => {
      // Invalidate both the specific category and the list
      queryClient.invalidateQueries({ queryKey: categoriesKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: categoriesKeys.lists() });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return await sdk.products.deleteCategory(id);
    },
    onSuccess: () => {
      // Invalidate categories list
      queryClient.invalidateQueries({ queryKey: categoriesKeys.lists() });
    },
  });

  return {
    // Queries
    useCategoriesList,
    
    // Mutations
    createCategory: createCategoryMutation.mutateAsync,
    updateCategory: updateCategoryMutation.mutateAsync,
    deleteCategory: deleteCategoryMutation.mutateAsync,
    
    // Mutation states
    isCreating: createCategoryMutation.isPending,
    isUpdating: updateCategoryMutation.isPending,
    isDeleting: deleteCategoryMutation.isPending,
    
    // Error states
    createError: createCategoryMutation.error,
    updateError: updateCategoryMutation.error,
    deleteError: deleteCategoryMutation.error,
  };
};