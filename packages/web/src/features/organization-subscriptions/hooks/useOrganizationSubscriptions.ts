import { useQuery } from '@tanstack/react-query';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { OrganizationAdminDetails } from '@gymspace/sdk';

export type SubscriptionStatus = 'active' | 'expired' | 'expiring_soon' | 'inactive';

export interface OrganizationWithSubscription extends OrganizationAdminDetails {
  // Enhanced subscription info
  subscriptionStatus?: SubscriptionStatus;
  subscriptionPlan?: {
    id: string;
    name: string;
    price: {
      PEN?: { currency: 'PEN'; value: number };
      USD?: { currency: 'USD'; value: number };
      COP?: { currency: 'COP'; value: number };
      MXN?: { currency: 'MXN'; value: number };
    };
    billingFrequency: string;
    maxGyms: number;
    maxClientsPerGym: number;
    maxUsersPerGym: number;
  };
  usage?: {
    gyms: number;
    totalClients: number;
    totalUsers: number;
  };
}

export function useOrganizationSubscriptions() {
  const { sdk } = useGymSdk();

  return useQuery({
    queryKey: ['organization-subscriptions'],
    queryFn: async () => {
      try {
        // Get organizations with enhanced subscription data
        const result = await sdk.organizations.listOrganizations();

        // Transform data to include subscription status categorization
        const enhancedOrgs = (result as OrganizationAdminDetails[]).map(org => {
          let subscriptionStatus: SubscriptionStatus = 'inactive';

          if (org.subscription) {
            if (org.subscription.isExpired) {
              subscriptionStatus = 'expired';
            } else if (org.subscription.isActive) {
              // Check if expiring soon (within 30 days)
              if (org.subscription.daysRemaining && org.subscription.daysRemaining <= 30) {
                subscriptionStatus = 'expiring_soon';
              } else {
                subscriptionStatus = 'active';
              }
            }
          }

          // Calculate usage from stats with null checks
          const usage = {
            gyms: org.stats?.totalGyms || 0,
            totalClients: org.stats?.totalClients || 0,
            totalUsers: org.gyms?.length || 0,
          };

          return {
            ...org,
            subscriptionStatus,
            usage,
          } as OrganizationWithSubscription;
        });

        return enhancedOrgs;
      } catch (err: any) {
        // Enhanced error handling
        if (err.response?.status === 403) {
          throw new Error('403: Forbidden - SUPER_ADMIN permission required');
        } else if (err.response?.status === 401) {
          throw new Error('401: Unauthorized - Please login');
        } else if (err.message === 'Network Error') {
          throw new Error('Network Error - Please check your connection');
        }
        throw err;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - more frequent updates for subscription data
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on permission errors
      if (error.message?.includes('403') || error.message?.includes('401')) {
        return false;
      }
      return failureCount < 3;
    },
  });
}