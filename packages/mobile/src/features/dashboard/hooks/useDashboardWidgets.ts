import { useQuery } from '@tanstack/react-query';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { useDashboardDateRange, useSetDashboardDateRange } from '../stores/dashboard.store';
import { useCallback } from 'react';

export const dashboardQueryKeys = {
  stats: ['dashboard', 'stats'],
  checkInsBase: ['dashboard', 'check-ins'],
  contractsRevenue: (startDate: Date | string, endDate: Date | string) => [
    'dashboard',
    'contracts-revenue',
    startDate,
    endDate,
  ],
  salesRevenue: (startDate: Date | string, endDate: Date | string) => [
    'dashboard',
    'sales-revenue',
    startDate,
    endDate,
  ],
  debts: (startDate: Date | string, endDate: Date | string) => [
    'dashboard',
    'debts',
    startDate,
    endDate,
  ],
  checkIns: (startDate: Date | string, endDate: Date | string) => [
    ...dashboardQueryKeys.checkInsBase,
    startDate,
    endDate,
  ],
  newClients: (startDate: Date | string, endDate: Date | string) => [
    'dashboard',
    'new-clients',
    startDate,
    endDate,
  ],
  expiringContracts: (startDate: Date | string, endDate: Date | string) => [
    'dashboard',
    'expiring-contracts',
    startDate,
    endDate,
  ],
};

// Helper to format dates  API
const formatDateForAPI = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Hook for dashboard stats (lightweight, no date range needed)
export const useDashboardStatsWidget = () => {
  const { sdk } = useGymSdk();
  return useQuery({
    queryKey: dashboardQueryKeys.stats,
    queryFn: async () => {
      return await sdk.dashboard.getStats();
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for contracts revenue widget
export const useContractsRevenueWidget = () => {
  const { sdk } = useGymSdk();
  const dateRange = useDashboardDateRange();
  return useQuery({
    queryKey: dashboardQueryKeys.contractsRevenue(dateRange.startDate, dateRange.endDate),
    queryFn: async () => {
      return await sdk.dashboard.getContractsRevenue({
        startDate: formatDateForAPI(dateRange.startDate),
        endDate: formatDateForAPI(dateRange.endDate),
      });
    },
    staleTime: 3 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

// Hook for sales revenue widget
export const useSalesRevenueWidget = () => {
  const { sdk } = useGymSdk();
  const dateRange = useDashboardDateRange();
  return useQuery({
    queryKey: dashboardQueryKeys.salesRevenue(dateRange.startDate, dateRange.endDate),
    queryFn: async () => {
      return await sdk.dashboard.getSalesRevenue({
        startDate: formatDateForAPI(dateRange.startDate),
        endDate: formatDateForAPI(dateRange.endDate),
      });
    },
    staleTime: 3 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

// Hook for debts widget
export const useDebtsWidget = () => {
  const { sdk } = useGymSdk();
  const dateRange = useDashboardDateRange();
  return useQuery({
    queryKey: dashboardQueryKeys.debts(dateRange.startDate, dateRange.endDate),
    queryFn: async () => {
      return await sdk.dashboard.getDebts({
        startDate: formatDateForAPI(dateRange.startDate),
        endDate: formatDateForAPI(dateRange.endDate),
      });
    },
    staleTime: 3 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

// Hook for check-ins widget
export const useCheckInsWidget = () => {
  const { sdk } = useGymSdk();
  const dateRange = useDashboardDateRange();
  return useQuery({
    queryKey: dashboardQueryKeys.checkIns(dateRange.startDate, dateRange.endDate),
    queryFn: async () => {
      return await sdk.dashboard.getCheckIns({
        startDate: formatDateForAPI(dateRange.startDate),
        endDate: formatDateForAPI(dateRange.endDate),
      });
    },
    staleTime: 3 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

// Hook for new clients widget
export const useNewClientsWidget = () => {
  const { sdk } = useGymSdk();
  const dateRange = useDashboardDateRange();
  return useQuery({
    queryKey: dashboardQueryKeys.newClients(dateRange.startDate, dateRange.endDate),
    queryFn: async () => {
      return await sdk.dashboard.getNewClients({
        startDate: formatDateForAPI(dateRange.startDate),
        endDate: formatDateForAPI(dateRange.endDate),
      });
    },
    staleTime: 3 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

// Hook for expiring contracts widget
export const useExpiringContractsWidget = () => {
  const { sdk } = useGymSdk();
  const dateRange = useDashboardDateRange();
  return useQuery({
    queryKey: dashboardQueryKeys.expiringContracts(dateRange.startDate, dateRange.endDate),
    queryFn: async () => {
      return await sdk.dashboard.getExpiringContracts(10, {
        startDate: formatDateForAPI(dateRange.startDate),
        endDate: formatDateForAPI(dateRange.endDate),
      });
    },
    staleTime: 3 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

// Main hook to manage date range changes
export const useDashboardDateRangeManager = () => {
  const dateRange = useDashboardDateRange();
  const setDateRange = useSetDashboardDateRange();

  const handleDateRangeChange = useCallback(
    (startDate: Date, endDate: Date) => {
      setDateRange(startDate, endDate);
    },
    [setDateRange],
  );

  return {
    dateRange,
    setDateRange: handleDateRangeChange,
  };
};
