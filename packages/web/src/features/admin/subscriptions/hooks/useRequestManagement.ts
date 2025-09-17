import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Types for request management
export interface SubscriptionRequest {
  id: string;
  organizationId: string;
  organizationName: string;
  requestedPlanId: string | null;
  requestedPlanName: string | null;
  currentPlanId: string | null;
  currentPlanName: string | null;
  action: 'upgrade' | 'downgrade' | 'cancel';
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requestedBy: string;
  requestedAt: string;
  processedBy: string | null;
  processedAt: string | null;
  rejectionReason: string | null;
  notes: string | null;
  metadata: Record<string, any>;
}

export interface ProcessRequestDto {
  action: 'approve' | 'reject' | 'cancel';
  rejectionReason?: string;
  notes?: string;
  startDate?: string;
}

export interface RequestAnalyticsQuery {
  status?: 'pending' | 'approved' | 'rejected' | 'cancelled';
  organizationId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface RequestAnalytics {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  cancelledRequests: number;
  averageProcessingTime: number;
  requestsByAction: {
    upgrade: number;
    downgrade: number;
    cancel: number;
  };
  processingTrends: Array<{
    date: string;
    pending: number;
    approved: number;
    rejected: number;
  }>;
}

// API client functions
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('auth_token');
  
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Hook: Get subscription requests with filtering
export function useSubscriptionRequests(query?: RequestAnalyticsQuery) {
  const queryString = new URLSearchParams();
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryString.append(key, String(value));
      }
    });
  }

  return useQuery({
    queryKey: ['subscription-requests', query],
    queryFn: () => fetchWithAuth(`/api/admin/subscriptions/requests?${queryString}`),
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Hook: Get pending requests only
export function usePendingRequests() {
  return useQuery({
    queryKey: ['subscription-requests', 'pending'],
    queryFn: () => fetchWithAuth('/api/admin/subscriptions/requests/pending'),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

// Hook: Process a subscription request
export function useProcessRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data: ProcessRequestDto }) =>
      fetchWithAuth(`/api/admin/subscriptions/requests/${requestId}/process`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['subscription-requests'] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['request-analytics'] });

      // Show success message
      if (variables.data.action === 'approve') {
        toast.success('Request approved successfully');
      } else if (variables.data.action === 'reject') {
        toast.success('Request rejected');
      } else {
        toast.success('Request cancelled');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to process request');
    },
  });
}

// Hook: Get request analytics
export function useRequestAnalytics(query?: RequestAnalyticsQuery) {
  const queryString = new URLSearchParams();
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryString.append(key, String(value));
      }
    });
  }

  return useQuery({
    queryKey: ['request-analytics', query],
    queryFn: () => fetchWithAuth(`/api/admin/subscriptions/analytics/requests?${queryString}`),
    staleTime: 60 * 1000, // 1 minute
  });
}

// Hook: Bulk process multiple requests
export function useBulkProcessRequests() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      requestIds, 
      action 
    }: { 
      requestIds: string[]; 
      action: ProcessRequestDto 
    }) => {
      const results = await Promise.allSettled(
        requestIds.map((requestId) =>
          fetchWithAuth(`/api/admin/subscriptions/requests/${requestId}/process`, {
            method: 'PUT',
            body: JSON.stringify(action),
          })
        )
      );

      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      return { successful, failed, total: requestIds.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subscription-requests'] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['request-analytics'] });

      if (data.failed === 0) {
        toast.success(`Successfully processed ${data.successful} requests`);
      } else {
        toast.warning(
          `Processed ${data.successful} requests successfully, ${data.failed} failed`
        );
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to process requests');
    },
  });
}

// Hook: Get request by ID
export function useSubscriptionRequest(requestId: string) {
  return useQuery({
    queryKey: ['subscription-request', requestId],
    queryFn: () => fetchWithAuth(`/api/admin/subscriptions/requests/${requestId}`),
    enabled: !!requestId,
  });
}