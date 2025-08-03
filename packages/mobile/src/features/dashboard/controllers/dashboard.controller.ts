import { useQuery } from '@tanstack/react-query';
import { useGymSdk } from '../../../providers/GymSdkProvider';

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
      // Mock data for now - replace with actual SDK calls
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      // In real implementation, these would be parallel SDK calls
      return {
        totalClients: 156,
        activeClients: 142,
        totalContracts: 168,
        activeContracts: 142,
        monthlyRevenue: 4250.00,
        todayCheckIns: 23,
        expiringContractsCount: 8,
        newClientsThisMonth: 12,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Get recent activity
  const recentActivityQuery = useQuery({
    queryKey: dashboardKeys.recentActivity(),
    queryFn: async (): Promise<RecentActivity[]> => {
      // Mock data - replace with actual SDK call
      return [
        {
          id: '1',
          type: 'check_in',
          description: 'Check-in registrado',
          timestamp: new Date().toISOString(),
          clientName: 'Juan Pérez',
          clientId: 'client1',
        },
        {
          id: '2',
          type: 'new_client',
          description: 'Nuevo cliente registrado',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          clientName: 'María García',
          clientId: 'client2',
        },
        {
          id: '3',
          type: 'new_contract',
          description: 'Nuevo contrato creado',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          clientName: 'Carlos López',
          clientId: 'client3',
        },
      ];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Get expiring contracts
  const expiringContractsQuery = useQuery({
    queryKey: dashboardKeys.expiringContracts(),
    queryFn: async (): Promise<ExpiringContract[]> => {
      // Mock data - replace with SDK call for contracts expiring in next 30 days
      return [
        {
          id: '1',
          clientName: 'Ana Martínez',
          clientId: 'client4',
          planName: 'Plan Premium',
          endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          daysRemaining: 5,
        },
        {
          id: '2',
          clientName: 'Roberto Silva',
          clientId: 'client5',
          planName: 'Plan Básico',
          endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          daysRemaining: 10,
        },
        {
          id: '3',
          clientName: 'Laura Rodríguez',
          clientId: 'client6',
          planName: 'Plan VIP',
          endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          daysRemaining: 15,
        },
      ];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Quick actions
  const registerCheckIn = async (clientId: string) => {
    try {
      await sdk.checkIns.create({ gymClientId: clientId });
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