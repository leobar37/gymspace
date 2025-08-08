import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { 
  Contract, 
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

// Types
export interface ContractFormData {
  gymClientId: string;
  gymMembershipPlanId: string;
  startDate: string;
  discountPercentage?: number;
  finalPrice?: number;
  metadata?: Record<string, any>;
}

export interface RenewFormData {
  startDate?: string;
  discountPercentage?: number;
  finalPrice?: number;
  metadata?: Record<string, any>;
}

export interface FreezeFormData {
  freezeStartDate: string;
  freezeEndDate: string;
  reason?: string;
}

export interface SearchFilters {
  status?: ContractStatus;
  page?: number;
  limit?: number;
}

export const useContractsController = () => {
  const { sdk } = useGymSdk();
  const queryClient = useQueryClient();

  // Get contracts list
  const useContractsList = (filters: SearchFilters = {}) => {
    return useQuery({
      queryKey: contractsKeys.list(filters),
      queryFn: async () => {
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const offset = (page - 1) * limit;
        
        const params: GetContractsParams = {
          status: filters.status,
          limit,
          offset,
        } as any; // Type assertion needed as SDK types expect page/limit but API uses offset/limit
        
        const response = await sdk.contracts.getGymContracts(params);
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
      const createData: CreateContractDto = {
        gymClientId: data.gymClientId,
        gymMembershipPlanId: data.gymMembershipPlanId,
        startDate: data.startDate,
        discountPercentage: data.discountPercentage,
        finalPrice: data.finalPrice,
        metadata: data.metadata,
      };
      const response = await sdk.contracts.createContract(createData);
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
      }
    },
  });

  // Renew contract mutation
  const renewContractMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: RenewFormData }) => {
      const renewData: RenewContractDto = {
        startDate: data.startDate,
        discountPercentage: data.discountPercentage,
        finalPrice: data.finalPrice,
        metadata: data.metadata,
      };
      const response = await sdk.contracts.renewContract(id, renewData);
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
      }
    },
  });

  // Freeze contract mutation
  const freezeContractMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FreezeFormData }) => {
      const freezeData: FreezeContractDto = {
        freezeStartDate: data.freezeStartDate,
        freezeEndDate: data.freezeEndDate,
        reason: data.reason,
      };
      const response = await sdk.contracts.freezeContract(id, freezeData);
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
      }
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
      }
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