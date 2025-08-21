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
  email?: string; // Made optional
  phone?: string;
  documentValue?: string;
  documentType?: string;
  birthDate?: string;
  address?: string;
  notes?: string;
  // Legacy fields for backward compatibility
  document?: string;
  documentId?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalConditions?: string;
  profilePhotoId?: string;
}

export interface SearchFilters {
  search?: string;
  activeOnly?: boolean;
  page?: number;
  limit?: number;
}

export const useClientsController = () => {
  const { sdk } = useGymSdk();
  const queryClient = useQueryClient();

  // Get clients list
  const useClientsList = (filters: SearchFilters = {}) => {
    
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
      staleTime: 2 * 60 * 1000, // 2 minutes
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
    mutationFn: async (data: ClientFormData) => {
      // Transform ClientFormData to CreateClientDto
      const createData = {
        name: data.name,
        email: data.email, // Now optional
        phone: data.phone,
        documentValue: data.documentValue || data.document || data.documentId,
        documentType: data.documentType,
        birthDate: data.birthDate,
        address: data.address,
        notes: data.notes,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        medicalConditions: data.medicalConditions,
      };
      const response = await sdk.clients.createClient(createData);
      return response;
    },
    onSuccess: () => {
      // Invalidate clients list to refetch
      queryClient.invalidateQueries({ queryKey: clientsKeys.lists() });
    },
  });

  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ClientFormData> }) => {
      // Transform ClientFormData to UpdateClientDto
      const updateData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        documentValue: data.documentValue || data.document || data.documentId,
        documentType: data.documentType,
        birthDate: data.birthDate,
        address: data.address,
        notes: data.notes,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        medicalConditions: data.medicalConditions,
      };
      const response = await sdk.clients.updateClient(id, updateData);
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

  // Note: There is no delete endpoint for clients in the API
  // Clients are managed through status toggling (active/inactive)
  // const deleteClientMutation = useMutation({
  //   mutationFn: async (clientId: string) => {
  //     await sdk.clients.delete(clientId);
  //   },
  //   onSuccess: (_, clientId) => {
  //     queryClient.removeQueries({ queryKey: clientsKeys.detail(clientId) });
  //     queryClient.invalidateQueries({ queryKey: clientsKeys.lists() });
  //   },
  // });

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

    // deleteClient: deleteClientMutation.mutate,
    // isDeletingClient: deleteClientMutation.isPending,

    // Utilities
    prefetchClient,
    invalidateClients: () => queryClient.invalidateQueries({ queryKey: clientsKeys.all }),
  };
};
