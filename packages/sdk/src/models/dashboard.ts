// Dashboard Types and Interfaces

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

export type ActivityType = 'check_in' | 'new_client' | 'new_contract' | 'contract_expired';

export interface RecentActivity {
  id: string;
  type: ActivityType;
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