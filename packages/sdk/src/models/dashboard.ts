// Dashboard Types and Interfaces

export interface DashboardStats {
  totalClients: number;
  activeClients: number;
  totalContracts: number;
  activeContracts: number;
  monthlyRevenue: number; // Deprecated, use getContractsRevenue instead
  todayCheckIns: number;
  expiringContractsCount: number;
  newClientsThisMonth: number;
}

export interface ContractsRevenue {
  totalRevenue: number;
  contractCount: number;
  averageRevenue: number;
  startDate: string;
  endDate: string;
}

export interface SalesRevenue {
  totalRevenue: number;
  salesCount: number;
  averageRevenue: number;
  startDate: string;
  endDate: string;
}

export interface Debts {
  totalDebt: number;
  clientsWithDebt: number;
  averageDebt: number;
  startDate: string;
  endDate: string;
}

export interface CheckIns {
  totalCheckIns: number;
  uniqueClients: number;
  averagePerDay: number;
  startDate: string;
  endDate: string;
}

export interface NewClients {
  totalNewClients: number;
  averagePerDay: number;
  startDate: string;
  endDate: string;
}

export interface ExpiringContract {
  id: string;
  clientName: string;
  clientId: string;
  planName: string;
  endDate: string;
  daysRemaining: number;
}

export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}