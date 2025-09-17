import { useQuery } from '@tanstack/react-query';
import { useGymSdk } from '@/providers/GymSdkProvider';

export interface AdminOrganization {
  id: string;
  name: string;
  owner: {
    id: string;
    email: string;
    fullName: string;
  };
  gyms: {
    id: string;
    name: string;
    address: string;
  }[];
  subscription?: {
    plan: string;
    price?: number;
    status: 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'CANCELLED' | 'PENDING';
    startedAt: Date;
    expiresAt?: Date;
    usage: {
      gyms: number;
      clients: number;
      users: number;
    };
    limits: {
      gyms: number;
      clients: number;
      users: number;
    };
  };
  createdAt: Date;
}

export function useAdminOrganizations() {
  const { sdk } = useGymSdk();

  return useQuery({
    queryKey: ['admin', 'organizations'],
    queryFn: async () => {
      try {
        // TODO: Replace with actual SDK call when admin resource is available
        // This should fetch organizations with their subscription status
        // const result = await sdk.adminSubscriptions.getOrganizations();
        // return result as AdminOrganization[];
        
        // Mock data for now - simulating organizations with subscription info
        return [
          {
            id: '1',
            name: 'PowerFit Gym',
            owner: {
              id: 'user1',
              email: 'admin@powerfit.com',
              fullName: 'John Smith',
            },
            gyms: [
              {
                id: 'gym1',
                name: 'PowerFit Downtown',
                address: '123 Main St, Downtown',
              },
              {
                id: 'gym2',
                name: 'PowerFit Uptown',
                address: '456 Park Ave, Uptown',
              },
            ],
            subscription: {
              plan: 'Professional Plan',
              price: 79,
              status: 'ACTIVE',
              startedAt: new Date('2024-01-01'),
              expiresAt: new Date('2024-12-31'),
              usage: {
                gyms: 2,
                clients: 450,
                users: 8,
              },
              limits: {
                gyms: 3,
                clients: 1000,
                users: 15,
              },
            },
            createdAt: new Date('2023-06-15'),
          },
          {
            id: '2',
            name: 'Elite Fitness',
            owner: {
              id: 'user2',
              email: 'owner@elitefitness.com',
              fullName: 'Sarah Johnson',
            },
            gyms: [
              {
                id: 'gym3',
                name: 'Elite Fitness Center',
                address: '789 Fitness Blvd',
              },
            ],
            subscription: {
              plan: 'Starter Plan',
              price: 29,
              status: 'ACTIVE',
              startedAt: new Date('2024-03-01'),
              expiresAt: new Date('2024-11-15'),
              usage: {
                gyms: 1,
                clients: 180,
                users: 4,
              },
              limits: {
                gyms: 1,
                clients: 200,
                users: 5,
              },
            },
            createdAt: new Date('2024-03-01'),
          },
          {
            id: '3',
            name: 'Community Gym',
            owner: {
              id: 'user3',
              email: 'info@communitygym.org',
              fullName: 'Mike Wilson',
            },
            gyms: [
              {
                id: 'gym4',
                name: 'Community Fitness',
                address: '321 Community Center',
              },
            ],
            subscription: {
              plan: 'Free Plan',
              status: 'ACTIVE',
              startedAt: new Date('2024-05-01'),
              usage: {
                gyms: 1,
                clients: 45,
                users: 2,
              },
              limits: {
                gyms: 1,
                clients: 50,
                users: 2,
              },
            },
            createdAt: new Date('2024-05-01'),
          },
          {
            id: '4',
            name: 'Muscle Factory',
            owner: {
              id: 'user4',
              email: 'admin@musclefactory.com',
              fullName: 'David Brown',
            },
            gyms: [],
            subscription: {
              plan: 'Professional Plan',
              price: 79,
              status: 'EXPIRED',
              startedAt: new Date('2023-10-01'),
              expiresAt: new Date('2024-10-01'),
              usage: {
                gyms: 0,
                clients: 0,
                users: 0,
              },
              limits: {
                gyms: 3,
                clients: 1000,
                users: 15,
              },
            },
            createdAt: new Date('2023-10-01'),
          },
          {
            id: '5',
            name: 'Yoga Studio Plus',
            owner: {
              id: 'user5',
              email: 'namaste@yogastudioplus.com',
              fullName: 'Emily Chen',
            },
            gyms: [
              {
                id: 'gym5',
                name: 'Yoga Studio Plus Main',
                address: '555 Zen Street',
              },
            ],
            subscription: {
              plan: 'Starter Plan',
              price: 29,
              status: 'TRIAL',
              startedAt: new Date('2024-10-01'),
              expiresAt: new Date('2024-10-14'),
              usage: {
                gyms: 1,
                clients: 25,
                users: 2,
              },
              limits: {
                gyms: 1,
                clients: 200,
                users: 5,
              },
            },
            createdAt: new Date('2024-10-01'),
          },
        ] as AdminOrganization[];
      } catch (error: any) {
        console.error('Failed to fetch organizations:', error);
        throw new Error(error.message || 'Failed to fetch organizations');
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}