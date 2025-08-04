import { useQuery } from '@tanstack/react-query';
import { useGymSdk } from '@/providers/GymSdkProvider';

// Query keys
export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  recentActivity: () => [...dashboardKeys.all, 'recentActivity'] as const,
  expiringContracts: () => [...dashboardKeys.all, 'expiringContracts'] as const,
};

// Types
export interface DashboardStats {
  totalClients: number;
  activeClients: number;
  totalContracts: number;
  activeContracts: number;
  monthlyRevenue: number;
  todayCheckIns: number;
  expiringContractsCount: number;
  newClientsThisMonth: number;
}

export interface RecentActivity {
  id: string;
  type: 'check_in' | 'new_client' | 'new_contract' | 'contract_expired';
  description: string;
  timestamp: string;
  clientName?: string;
  clientId?: string;
}

export interface ExpiringContract {
  id: string;
  clientName: string;
  clientId: string;
  planName: string;
  endDate: string;
  daysRemaining: number;
}

export const useDashboardController = () => {
  const { sdk } = useGymSdk();

  // Get dashboard stats
  const statsQuery = useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: async (): Promise<DashboardStats> => {
      return await sdk.dashboard.getStats();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Get recent activity
  const recentActivityQuery = useQuery({
    queryKey: dashboardKeys.recentActivity(),
    queryFn: async (): Promise<RecentActivity[]> => {
      return await sdk.dashboard.getRecentActivity(10);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Get expiring contracts
  const expiringContractsQuery = useQuery({
    queryKey: dashboardKeys.expiringContracts(),
    queryFn: async (): Promise<ExpiringContract[]> => {
      return await sdk.dashboard.getExpiringContracts(10);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Quick actions
  const registerCheckIn = async (clientId: string) => {
    try {
      // await sdk.checkIns.create({ clientId });
      // Invalidate stats to show updated check-in count
      statsQuery.refetch();
      recentActivityQuery.refetch();
    } catch (error) {
      console.error('Failed to register check-in:', error);
      throw error;
    }
  };

  return {
    // Stats
    stats: statsQuery.data,
    isLoadingStats: statsQuery.isLoading,
    statsError: statsQuery.error,
    refreshStats: statsQuery.refetch,

    // Recent activity
    recentActivity: recentActivityQuery.data,
    isLoadingActivity: recentActivityQuery.isLoading,
    
    // Expiring contracts
    expiringContracts: expiringContractsQuery.data,
    isLoadingExpiringContracts: expiringContractsQuery.isLoading,
    
    // Actions
    registerCheckIn,
    
    // Refresh all
    refreshDashboard: () => {
      statsQuery.refetch();
      recentActivityQuery.refetch();
      expiringContractsQuery.refetch();
    },
  };
};