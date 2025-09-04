import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { dashboardKeys } from '@/features/dashboard/controllers/dashboard.controller';
import { clientsKeys } from '@/features/clients/controllers/clients.controller';
import { 
  CreateContractDto, 
  RenewContractDto, 
  FreezeContractDto,
  GetContractsParams,
  ContractStatus
} from '@gymspace/sdk';

// Query keys
export const contractsKeys = {
  all: ['contracts'] as const,
  lists: () => [...contractsKeys.all, 'list'] as const,
  list: (filters: any) => [...contractsKeys.lists(), { filters }] as const,
  details: () => [...contractsKeys.all, 'detail'] as const,
  detail: (id: string) => [...contractsKeys.details(), id] as const,
  clientContracts: (clientId: string) => [...contractsKeys.all, 'client', clientId] as const,
};

// Use SDK types directly instead of duplicating them
export type ContractFormData = CreateContractDto;
export type RenewFormData = RenewContractDto;
export type FreezeFormData = FreezeContractDto;

export interface SearchFilters {
  status?: ContractStatus;
  clientName?: string;
  page?: number;
  limit?: number;
}

export const useContractsController = () => {
  const { sdk } = useGymSdk();
  const queryClient = useQueryClient();

  // Get contracts list with pagination support
  const useContractsList = (filters: SearchFilters = {}) => {
    return useQuery({
      queryKey: contractsKeys.list(filters),
      queryFn: async () => {
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        
        const params: GetContractsParams = {
          status: filters.status,
          clientName: filters.clientName,
          page,
          limit,
        };
        
        const response = await sdk.contracts.searchContracts(params);
        return response;
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  };

  // Get contract details
  const useContractDetail = (contractId: string) => {
    return useQuery({
      queryKey: contractsKeys.detail(contractId),
      queryFn: async () => {
        const response = await sdk.contracts.getContract(contractId);
        return response;
      },
      enabled: !!contractId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Get client contracts
  const useClientContracts = (clientId: string) => {
    return useQuery({
      queryKey: contractsKeys.clientContracts(clientId),
      queryFn: async () => {
        const response = await sdk.contracts.getClientContracts(clientId);
        return response;
      },
      enabled: !!clientId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Create contract mutation
  const createContractMutation = useMutation({
    mutationFn: async (data: ContractFormData) => {
      // Since ContractFormData is now the same as CreateContractDto, we can pass it directly
      const response = await sdk.contracts.createContract(data);
      return response;
    },
    onSuccess: (data) => {
      // Invalidate contracts list to refetch
      queryClient.invalidateQueries({ queryKey: contractsKeys.lists() });
      // Also invalidate client contracts if we have the client ID
      if (data.gymClientId) {
        queryClient.invalidateQueries({ 
          queryKey: contractsKeys.clientContracts(data.gymClientId) 
        });
        // Invalidate client stats to refresh contract-related data
        queryClient.invalidateQueries({ queryKey: clientsKeys.stats(data.gymClientId) });
      }
      
      // Invalidate dashboard stats (contract counts, recent activity, revenue)
      queryClient.invalidateQueries({ queryKey: dashboardKeys.stats() });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.recentActivity() });
    },
  });

  // Renew contract mutation
  const renewContractMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: RenewFormData }) => {
      // Since RenewFormData is now the same as RenewContractDto, we can pass it directly
      const response = await sdk.contracts.renewContract(id, data);
      return response;
    },
    onSuccess: (data, variables) => {
      // Invalidate the specific contract detail to refetch with renewals
      queryClient.invalidateQueries({ queryKey: contractsKeys.detail(variables.id) });
      // Invalidate list to show updated data
      queryClient.invalidateQueries({ queryKey: contractsKeys.lists() });
      // Also invalidate client contracts
      if (data.gymClientId) {
        queryClient.invalidateQueries({ 
          queryKey: contractsKeys.clientContracts(data.gymClientId) 
        });
        // Invalidate client stats to refresh contract-related data
        queryClient.invalidateQueries({ queryKey: clientsKeys.stats(data.gymClientId) });
      }
      
      // Invalidate dashboard stats (contract renewals affect revenue, recent activity)
      queryClient.invalidateQueries({ queryKey: dashboardKeys.stats() });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.recentActivity() });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.expiringContracts() });
    },
  });

  // Freeze contract mutation
  const freezeContractMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FreezeFormData }) => {
      // Since FreezeFormData is now the same as FreezeContractDto, we can pass it directly
      const response = await sdk.contracts.freezeContract(id, data);
      return response;
    },
    onSuccess: (data, variables) => {
      // Update cache for this contract
      queryClient.setQueryData(contractsKeys.detail(variables.id), data);
      // Invalidate list to show updated data
      queryClient.invalidateQueries({ queryKey: contractsKeys.lists() });
      // Also invalidate client contracts
      if (data.gymClientId) {
        queryClient.invalidateQueries({ 
          queryKey: contractsKeys.clientContracts(data.gymClientId) 
        });
        // Invalidate client stats to refresh contract-related data
        queryClient.invalidateQueries({ queryKey: clientsKeys.stats(data.gymClientId) });
      }
      
      // Invalidate dashboard stats (frozen contracts affect active count, recent activity)
      queryClient.invalidateQueries({ queryKey: dashboardKeys.stats() });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.recentActivity() });
    },
  });

  // Cancel contract mutation
  const cancelContractMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await sdk.contracts.cancelContract(id, { reason });
      return response;
    },
    onSuccess: (data, variables) => {
      // Update cache for this contract
      queryClient.setQueryData(contractsKeys.detail(variables.id), data);
      // Invalidate list to show updated data
      queryClient.invalidateQueries({ queryKey: contractsKeys.lists() });
      // Also invalidate client contracts
      if (data.gymClientId) {
        queryClient.invalidateQueries({ 
          queryKey: contractsKeys.clientContracts(data.gymClientId) 
        });
        // Invalidate client stats to refresh contract-related data
        queryClient.invalidateQueries({ queryKey: clientsKeys.stats(data.gymClientId) });
      }
      
      // Invalidate dashboard stats (cancelled contracts affect active count, recent activity)
      queryClient.invalidateQueries({ queryKey: dashboardKeys.stats() });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.recentActivity() });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.expiringContracts() });
    },
  });

  // Prefetch contract data
  const prefetchContract = async (contractId: string) => {
    await queryClient.prefetchQuery({
      queryKey: contractsKeys.detail(contractId),
      queryFn: async () => {
        const response = await sdk.contracts.getContract(contractId);
        return response;
      },
    });
  };

  return {
    // Query hooks
    useContractsList,
    useContractDetail,
    useClientContracts,
    
    // Mutations
    createContract: createContractMutation.mutate,
    isCreatingContract: createContractMutation.isPending,
    createContractError: createContractMutation.error,
    
    renewContract: renewContractMutation.mutate,
    isRenewingContract: renewContractMutation.isPending,
    
    freezeContract: freezeContractMutation.mutate,
    isFreezingContract: freezeContractMutation.isPending,
    
    cancelContract: cancelContractMutation.mutate,
    isCancellingContract: cancelContractMutation.isPending,
    
    // Utilities
    prefetchContract,
    invalidateContracts: () => queryClient.invalidateQueries({ queryKey: contractsKeys.all }),
  };
};