import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useGymSdk } from '@/providers/GymSdkProvider';

// Query keys
export const clientsKeys = {
  all: ['clients'] as const,
  lists: () => [...clientsKeys.all, 'list'] as const,
  list: (filters: any) => [...clientsKeys.lists(), { filters }] as const,
  details: () => [...clientsKeys.all, 'detail'] as const,
  detail: (id: string) => [...clientsKeys.details(), id] as const,
  stats: (id: string) => [...clientsKeys.detail(id), 'stats'] as const,
};

// Types
export interface ClientFormData {
  name: string;
  birthDate: string;
  documentId: string;
  phone: string;
  email?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalConditions?: string;
  notes?: string;
}

export interface SearchFilters {
  search?: string;
  activeOnly?: boolean;
  limit?: number;
  offset?: number;
}

export const useClientsController = () => {
  const { sdk } = useGymSdk();
  const queryClient = useQueryClient();

  // Get clients list
  const useClientsList = (filters: SearchFilters = {}) => {
    return useQuery({
      queryKey: clientsKeys.list(filters),
      queryFn: async () => {
        const response = await sdk.clients.search({
          ...filters,
          limit: filters.limit || 20,
        });
        return response.data;
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  };

  // Get client details
  const useClientDetail = (clientId: string) => {
    return useQuery({
      queryKey: clientsKeys.detail(clientId),
      queryFn: async () => {
        const response = await sdk.clients.getById(clientId);
        return response.data;
      },
      enabled: !!clientId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Get client stats
  const useClientStats = (clientId: string) => {
    return useQuery({
      queryKey: clientsKeys.stats(clientId),
      queryFn: async () => {
        const response = await sdk.clients.getStats(clientId);
        return response.data;
      },
      enabled: !!clientId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Create client mutation
  const createClientMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      const response = await sdk.clients.create(data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate clients list to refetch
      queryClient.invalidateQueries({ queryKey: clientsKeys.lists() });
    },
  });

  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ClientFormData> }) => {
      const response = await sdk.clients.update(id, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Update cache for this client
      queryClient.setQueryData(clientsKeys.detail(variables.id), data);
      // Invalidate list to show updated data
      queryClient.invalidateQueries({ queryKey: clientsKeys.lists() });
    },
  });

  // Toggle client status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const response = await sdk.clients.toggleStatus(clientId);
      return response.data;
    },
    onSuccess: (data, clientId) => {
      // Update client detail cache
      queryClient.setQueryData(clientsKeys.detail(clientId), data);
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: clientsKeys.lists() });
    },
  });

  // Delete client mutation
  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      await sdk.clients.delete(clientId);
    },
    onSuccess: (_, clientId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: clientsKeys.detail(clientId) });
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: clientsKeys.lists() });
    },
  });

  // Prefetch client data
  const prefetchClient = async (clientId: string) => {
    await queryClient.prefetchQuery({
      queryKey: clientsKeys.detail(clientId),
      queryFn: async () => {
        const response = await sdk.clients.getById(clientId);
        return response.data;
      },
    });
  };

  return {
    // Query hooks
    useClientsList,
    useClientDetail,
    useClientStats,
    
    // Mutations
    createClient: createClientMutation.mutate,
    isCreatingClient: createClientMutation.isPending,
    createClientError: createClientMutation.error,
    
    updateClient: updateClientMutation.mutate,
    isUpdatingClient: updateClientMutation.isPending,
    
    toggleStatus: toggleStatusMutation.mutate,
    isTogglingStatus: toggleStatusMutation.isPending,
    
    deleteClient: deleteClientMutation.mutate,
    isDeletingClient: deleteClientMutation.isPending,
    
    // Utilities
    prefetchClient,
    invalidateClients: () => queryClient.invalidateQueries({ queryKey: clientsKeys.all }),
  };
};