import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useGymSdk } from '@/providers/GymSdkProvider';
import type { CreateClientDto, UpdateClientDto, Client, SearchClientsParams } from '@gymspace/sdk';

// Query keys
export const clientsKeys = {
  all: ['clients'] as const,
  lists: () => [...clientsKeys.all, 'list'] as const,
  list: (filters: any) => [...clientsKeys.lists(), { filters }] as const,
  details: () => [...clientsKeys.all, 'detail'] as const,
  detail: (id: string) => [...clientsKeys.details(), id] as const,
  stats: (id: string) => [...clientsKeys.detail(id), 'stats'] as const,
};

// Re-export SDK types
export type { CreateClientDto, UpdateClientDto, Client } from '@gymspace/sdk';

// Form data type for internal use (matches form schema)
export interface ClientFormData {
  name: string;
  email?: string;
  phone?: string;
  documentValue?: string;
  documentType?: string;
  birthDate?: Date | string | null;
  gender?: string;
  maritalStatus?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  occupation?: string;
  notes?: string;
  profilePhotoId?: string | null;
  customData?: Record<string, any>;
}

export interface SearchFilters extends SearchClientsParams {}

export const useClientsController = () => {
  const { sdk } = useGymSdk();
  const queryClient = useQueryClient();

  // Get clients list
  const useClientsList = (
    filters: SearchFilters = {
      page: 1,
      limit: 20,
    },
  ) => {
    return useQuery({
      queryKey: clientsKeys.list(filters),
      queryFn: async () => {
        const response = await sdk.clients.searchClients({
          ...filters,
          page: filters.page || 1,
          limit: filters.limit || 20,
        });
        return response;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Get client details
  const useClientDetail = (clientId: string | undefined) => {
    return useQuery({
      queryKey: clientId ? clientsKeys.detail(clientId) : ['client-detail-empty'],
      queryFn: async () => {
        if (!clientId) return null;
        const response = await sdk.clients.getClient(clientId);
        return response;
      },
      enabled: !!clientId && clientId.length > 0,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Get client stats
  const useClientStats = (clientId: string) => {
    return useQuery({
      queryKey: clientsKeys.stats(clientId),
      queryFn: async () => {
        const response = await sdk.clients.getClientStats(clientId);
        return response;
      },
      enabled: !!clientId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Create client mutation
  const createClientMutation = useMutation({
    mutationFn: async (data: CreateClientDto) => {
      const response = await sdk.clients.createClient(data);
      return response;
    },
    onSuccess: () => {
      // Invalidate clients list to refetch
      queryClient.invalidateQueries({ queryKey: clientsKeys.lists() });
    },
  });

  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateClientDto }) => {
      const response = await sdk.clients.updateClient(id, data);
      return response;
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
      const response = await sdk.clients.toggleClientStatus(clientId);
      return response;
    },
    onSuccess: (data, clientId) => {
      // Update client detail cache
      queryClient.setQueryData(clientsKeys.detail(clientId), data);
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: clientsKeys.lists() });
    },
  });

  // Prefetch client data
  const prefetchClient = async (clientId: string) => {
    await queryClient.prefetchQuery({
      queryKey: clientsKeys.detail(clientId),
      queryFn: async () => {
        const response = await sdk.clients.getClient(clientId);
        return response;
      },
    });
  };

  // Prefetch clients list
  const prefetchClientsList = async () => {
    const filters = { page: 1, limit: 1000 };
    await queryClient.prefetchQuery({
      queryKey: clientsKeys.list(filters),
      queryFn: async () => {
        const response = await sdk.clients.searchClients(filters);
        return response;
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  };

  // Create client with callbacks
  const createClientWithCallbacks = (
    data: CreateClientDto,
    callbacks?: {
      onSuccess?: (client: Client) => void;
      onError?: (error: any) => void;
    }
  ) => {
    createClientMutation.mutate(data, {
      onSuccess: (client) => {
        callbacks?.onSuccess?.(client);
      },
      onError: (error) => {
        callbacks?.onError?.(error);
      },
    });
  };

  // Update client with callbacks
  const updateClientWithCallbacks = (
    id: string,
    data: UpdateClientDto,
    callbacks?: {
      onSuccess?: (client: Client) => void;
      onError?: (error: any) => void;
    }
  ) => {
    updateClientMutation.mutate({ id, data }, {
      onSuccess: (client) => {
        callbacks?.onSuccess?.(client);
      },
      onError: (error) => {
        callbacks?.onError?.(error);
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
    createClientWithCallbacks,
    isCreatingClient: createClientMutation.isPending,
    createClientError: createClientMutation.error,

    updateClient: updateClientMutation.mutate,
    updateClientWithCallbacks,
    isUpdatingClient: updateClientMutation.isPending,

    toggleStatus: toggleStatusMutation.mutateAsync,
    isTogglingStatus: toggleStatusMutation.isPending,

    // deleteClient: deleteClientMutation.mutate,
    // isDeletingClient: deleteClientMutation.isPending,

    // Utilities
    prefetchClient,
    prefetchClientsList,
    invalidateClients: () => queryClient.invalidateQueries({ queryKey: clientsKeys.all }),
  };
};
