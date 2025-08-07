import { useQuery } from '@tanstack/react-query';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { useState, useMemo, useCallback } from 'react';
import { debounce } from 'lodash';
import { 
  Client, 
  SearchClientsParams,
  ClientSearchForCheckInResponse 
} from '@gymspace/sdk';

const QUERY_KEYS = {
  clientSearch: 'clientSearch',
  clientSearchCheckIn: 'clientSearchCheckIn',
} as const;

interface ClientSearchOptions {
  includeContractStatus?: boolean;
  activeOnly?: boolean;
  debounceMs?: number;
}

export const useClientSearchController = (options: ClientSearchOptions = {}) => {
  const { sdk, currentGymId } = useGymSdk();
  const gymId = currentGymId;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounced search update
  const updateDebouncedQuery = useMemo(
    () => debounce((query: string) => {
      setDebouncedQuery(query);
    }, options.debounceMs || 300),
    [options.debounceMs]
  );

  // Update search query
  const updateSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
    updateDebouncedQuery(query);
  }, [updateDebouncedQuery]);

  // Regular client search
  const useClientSearch = (params?: Omit<SearchClientsParams, 'search'>) => {
    const searchParams: SearchClientsParams = {
      ...params,
      search: debouncedQuery,
      activeOnly: options.activeOnly ?? params?.activeOnly,
      includeContractStatus: options.includeContractStatus ?? params?.includeContractStatus,
    };

    return useQuery({
      queryKey: [QUERY_KEYS.clientSearch, gymId, searchParams],
      queryFn: async () => {
        if (!gymId) throw new Error('No gym selected');
        return sdk.clients.searchClients(searchParams);
      },
      enabled: !!gymId && debouncedQuery.length >= 2, // Only search with 2+ characters
    });
  };

  // Client search specifically for check-in (includes contract validation)
  const useClientSearchForCheckIn = (params?: Omit<SearchClientsParams, 'search'>) => {
    const searchParams: SearchClientsParams = {
      ...params,
      search: debouncedQuery,
      // These are set by the endpoint but we include them for clarity
      activeOnly: true,
      includeContractStatus: true,
    };

    return useQuery({
      queryKey: [QUERY_KEYS.clientSearchCheckIn, gymId, searchParams],
      queryFn: async (): Promise<ClientSearchForCheckInResponse> => {
        if (!gymId) throw new Error('No gym selected');
        return sdk.clients.searchClientsForCheckIn(searchParams);
      },
      enabled: !!gymId && debouncedQuery.length >= 2,
    });
  };

  // Search by specific fields
  const searchByClientNumber = useCallback(async (clientNumber: string) => {
    return sdk.clients.searchClients({
      clientNumber,
      activeOnly: options.activeOnly,
      includeContractStatus: options.includeContractStatus,
    });
  }, [sdk, options]);

  const searchByDocumentId = useCallback(async (documentId: string) => {
    return sdk.clients.searchClients({
      documentId,
      activeOnly: options.activeOnly,
      includeContractStatus: options.includeContractStatus,
    });
  }, [sdk, options]);

  // Check if client can check in
  const canClientCheckIn = useCallback((client: Client): { 
    canCheckIn: boolean; 
    reason?: string 
  } => {
    // Check if client is active
    if (client.status !== 'active') {
      return { 
        canCheckIn: false, 
        reason: 'Client is inactive' 
      };
    }

    // Check if client has active contracts
    if (!client.contracts || client.contracts.length === 0) {
      return { 
        canCheckIn: false, 
        reason: 'No active membership' 
      };
    }

    // Check if any contract is valid
    const now = new Date();
    const hasValidContract = client.contracts.some(contract => {
      if (contract.status !== 'active') return false;
      
      const startDate = new Date(contract.startDate);
      const endDate = new Date(contract.endDate);
      
      return now >= startDate && now <= endDate;
    });

    if (!hasValidContract) {
      return { 
        canCheckIn: false, 
        reason: 'Membership expired' 
      };
    }

    return { canCheckIn: true };
  }, []);

  return {
    // State
    searchQuery,
    debouncedQuery,
    
    // Actions
    updateSearchQuery,
    setSearchQuery,
    clearSearch: () => {
      setSearchQuery('');
      setDebouncedQuery('');
    },
    
    // Queries
    useClientSearch,
    useClientSearchForCheckIn,
    
    // Utilities
    searchByClientNumber,
    searchByDocumentId,
    canClientCheckIn,
  };
};

// Specialized hook for check-in search
export const useCheckInClientSearch = () => {
  return useClientSearchController({
    includeContractStatus: true,
    activeOnly: true,
    debounceMs: 500, // Slightly longer debounce for check-in
  });
};