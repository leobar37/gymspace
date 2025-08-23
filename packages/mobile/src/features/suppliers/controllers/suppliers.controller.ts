import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { useSuppliersStore } from '../stores/suppliers.store';
import { router } from 'expo-router';
import { Alert } from 'react-native';

export const useSuppliers = (options?: {
  search?: string;
  status?: string;
}) => {
  const { sdk } = useGymSdk();
  const searchQuery = useSuppliersStore((state) => state.searchQuery);
  const filters = useSuppliersStore((state) => state.filters);

  return useQuery({
    queryKey: ['suppliers', searchQuery || options?.search, filters, options?.status],
    queryFn: async () => {
      const params: any = {
        limit: 50,
      };

      if (searchQuery || options?.search) {
        params.search = searchQuery || options?.search;
      }

      if (filters.status !== 'all' || options?.status) {
        params.status = options?.status || filters.status;
      }

      return await sdk.suppliers.searchSuppliers(params);
    },
  });
};

export const useSupplier = (id: string) => {
  const { sdk } = useGymSdk();

  return useQuery({
    queryKey: ['supplier', id],
    queryFn: async () => {
      return await sdk.suppliers.getSupplier(id);
    },
    enabled: !!id,
  });
};

export const useCreateSupplier = () => {
  const { sdk } = useGymSdk();
  const queryClient = useQueryClient();
  const closeModal = useSuppliersStore((state) => state.closeModal);

  return useMutation({
    mutationFn: async (data: any) => {
      return await sdk.suppliers.createSupplier(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      closeModal();
      Alert.alert('Éxito', 'Proveedor creado correctamente');
    },
    onError: (error: any) => {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'No se pudo crear el proveedor'
      );
    },
  });
};

export const useUpdateSupplier = () => {
  const { sdk } = useGymSdk();
  const queryClient = useQueryClient();
  const closeModal = useSuppliersStore((state) => state.closeModal);

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await sdk.suppliers.updateSupplier(id, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier', variables.id] });
      closeModal();
      Alert.alert('Éxito', 'Proveedor actualizado correctamente');
    },
    onError: (error: any) => {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'No se pudo actualizar el proveedor'
      );
    },
  });
};

export const useDeleteSupplier = () => {
  const { sdk } = useGymSdk();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await sdk.suppliers.deleteSupplier(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      Alert.alert('Éxito', 'Proveedor eliminado correctamente');
    },
    onError: (error: any) => {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'No se pudo eliminar el proveedor'
      );
    },
  });
};

export const useSuppliersController = () => {
  const {
    searchQuery,
    filters,
    setSearchQuery,
    setFilters,
    resetFilters,
    openCreateModal,
    openEditModal,
  } = useSuppliersStore();

  const handleCreate = () => {
    router.push('/suppliers/create');
  };

  const handleEdit = (id: string) => {
    router.push(`/suppliers/${id}/edit`);
  };

  const handleView = (id: string) => {
    router.push(`/suppliers/${id}`);
  };

  return {
    searchQuery,
    filters,
    setSearchQuery,
    setFilters,
    resetFilters,
    handleCreate,
    handleEdit,
    handleView,
    openCreateModal,
    openEditModal,
  };
};