import { useQuery } from '@tanstack/react-query';

// Types for analytics
export interface SubscriptionAnalyticsQuery {
  dateFrom?: string;
  dateTo?: string;
  planId?: string;
  organizationId?: string;
}

export interface SubscriptionAnalytics {
  overview: {
    totalSubscriptions: number;
    activeSubscriptions: number;
    churnedSubscriptions: number;
    growthRate: number;
    churnRate: number;
  };
  subscriptionsByPlan: Array<{
    planId: string;
    planName: string;
    count: number;
    percentage: number;
    revenue: number;
  }>;
  subscriptionTrends: Array<{
    date: string;
    active: number;
    new: number;
    churned: number;
    total: number;
  }>;
  retentionMetrics: {
    averageLifetime: number;
    retentionRate: number;
    churnReasons: Array<{
      reason: string;
      count: number;
      percentage: number;
    }>;
  };
}

export interface RevenueAnalytics {
  summary: {
    mrr: number;
    arr: number;
    averageRevenuePerUser: number;
    totalRevenue: number;
    projectedRevenue: number;
  };
  revenueByPlan: Array<{
    planId: string;
    planName: string;
    mrr: number;
    subscribers: number;
    percentage: number;
  }>;
  revenueTrends: Array<{
    date: string;
    mrr: number;
    newMrr: number;
    churnedMrr: number;
    netMrr: number;
  }>;
  revenueGrowth: {
    dailyGrowth: number;
    weeklyGrowth: number;
    monthlyGrowth: number;
    yearlyGrowth: number;
  };
}

export interface UsageTrends {
  overview: {
    totalOrganizations: number;
    activeOrganizations: number;
    averageGymsPerOrg: number;
    averageUsersPerOrg: number;
  };
  usageByPlan: Array<{
    planId: string;
    planName: string;
    avgGyms: number;
    avgUsers: number;
    avgClients: number;
    utilizationRate: number;
  }>;
  growthMetrics: Array<{
    date: string;
    organizations: number;
    gyms: number;
    users: number;
    clients: number;
  }>;
  topOrganizations: Array<{
    id: string;
    name: string;
    plan: string;
    gyms: number;
    users: number;
    clients: number;
    revenue: number;
  }>;
}

export interface SubscriptionHistoryQuery {
  organizationId?: string;
  dateFrom?: string;
  dateTo?: string;
  operationType?: string;
  page?: number;
  limit?: number;
}

export interface SubscriptionHistory {
  organization: {
    id: string;
    name: string;
    currentPlan: string | null;
    subscriptionStatus: string;
    joinedAt: string;
    totalSpent: number;
  };
  operations: Array<{
    id: string;
    type: string;
    planFrom: string | null;
    planTo: string | null;
    amount: number;
    status: string;
    performedBy: string;
    performedAt: string;
    notes: string | null;
  }>;
  summary: {
    totalOperations: number;
    totalRevenue: number;
    planChanges: number;
    averageSubscriptionLength: number;
  };
}

// API client
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function fetchWithAuth(url: string) {
  const token = localStorage.getItem('auth_token');
  
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Hook: Get subscription analytics
export function useSubscriptionAnalytics(query?: SubscriptionAnalyticsQuery) {
  const queryString = new URLSearchParams();
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryString.append(key, String(value));
      }
    });
  }

  return useQuery({
    queryKey: ['subscription-analytics', query],
    queryFn: () => fetchWithAuth(`/api/admin/subscriptions/analytics/subscriptions?${queryString}`),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook: Get revenue analytics
export function useRevenueAnalytics(query?: SubscriptionAnalyticsQuery) {
  const queryString = new URLSearchParams();
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryString.append(key, String(value));
      }
    });
  }

  return useQuery({
    queryKey: ['revenue-analytics', query],
    queryFn: () => fetchWithAuth(`/api/admin/subscriptions/analytics/revenue?${queryString}`),
    staleTime: 5 * 60 * 1000,
  });
}

// Hook: Get usage trends
export function useUsageTrends(query?: SubscriptionAnalyticsQuery) {
  const queryString = new URLSearchParams();
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryString.append(key, String(value));
      }
    });
  }

  return useQuery({
    queryKey: ['usage-trends', query],
    queryFn: () => fetchWithAuth(`/api/admin/subscriptions/analytics/usage-trends?${queryString}`),
    staleTime: 5 * 60 * 1000,
  });
}

// Hook: Get subscription history for an organization
export function useSubscriptionHistory(organizationId: string, query?: SubscriptionHistoryQuery) {
  const queryString = new URLSearchParams();
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryString.append(key, String(value));
      }
    });
  }

  return useQuery({
    queryKey: ['subscription-history', organizationId, query],
    queryFn: () => 
      fetchWithAuth(`/api/admin/subscriptions/organizations/${organizationId}/subscription-history?${queryString}`),
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Hook: Get aggregated analytics dashboard data
export function useAnalyticsDashboard(dateRange?: { from: string; to: string }) {
  return useQuery({
    queryKey: ['analytics-dashboard', dateRange],
    queryFn: async () => {
      const query = dateRange 
        ? { dateFrom: dateRange.from, dateTo: dateRange.to }
        : undefined;

      const [subscription, revenue, usage] = await Promise.all([
        fetchWithAuth(`/api/admin/subscriptions/analytics/subscriptions${query ? '?' + new URLSearchParams(query as any) : ''}`),
        fetchWithAuth(`/api/admin/subscriptions/analytics/revenue${query ? '?' + new URLSearchParams(query as any) : ''}`),
        fetchWithAuth(`/api/admin/subscriptions/analytics/usage-trends${query ? '?' + new URLSearchParams(query as any) : ''}`),
      ]);

      return {
        subscription,
        revenue,
        usage,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}