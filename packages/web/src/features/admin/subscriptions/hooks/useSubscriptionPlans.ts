import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { SubscriptionPlan, CreatePlanDto, UpdatePlanDto } from '../types';
import { toast } from 'sonner';

export function useSubscriptionPlans() {
  const { sdk } = useGymSdk();

  return useQuery({
    queryKey: ['admin', 'subscription-plans'],
    queryFn: async () => {
      try {
        // TODO: Replace with actual SDK call when admin resource is available
        // const result = await sdk.adminSubscriptions.getPlans();
        // return result as SubscriptionPlan[];
        
        // Mock data for now
        return [
          {
            id: '1',
            name: 'Free Plan',
            description: 'Perfect for small gyms just getting started',
            type: 'FREE',
            pricing: [{ amount: 0, currency: 'USD' }],
            limits: {
              gyms: 1,
              clients: 50,
              users: 2,
              storage: 1,
            },
            features: ['Basic member management', 'Simple check-in', 'Email support'],
            isPublic: true,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
          {
            id: '2',
            name: 'Starter Plan',
            description: 'For growing gyms with more needs',
            type: 'STARTER',
            pricing: [
              { amount: 29, currency: 'USD', interval: 'MONTHLY' },
              { amount: 290, currency: 'USD', interval: 'YEARLY' },
            ],
            limits: {
              gyms: 1,
              clients: 200,
              users: 5,
              storage: 5,
            },
            features: [
              'All Free features',
              'Advanced reporting',
              'Payment integration',
              'Priority support',
            ],
            isPublic: true,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
          {
            id: '3',
            name: 'Professional Plan',
            description: 'Complete solution for established gyms',
            type: 'PROFESSIONAL',
            pricing: [
              { amount: 79, currency: 'USD', interval: 'MONTHLY' },
              { amount: 790, currency: 'USD', interval: 'YEARLY' },
            ],
            limits: {
              gyms: 3,
              clients: 1000,
              users: 15,
              storage: 20,
            },
            features: [
              'All Starter features',
              'Multiple gym locations',
              'Custom branding',
              'API access',
              'Advanced analytics',
              '24/7 phone support',
            ],
            isPublic: true,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
        ] as SubscriptionPlan[];
      } catch (error: any) {
        console.error('Failed to fetch subscription plans:', error);
        throw new Error(error.message || 'Failed to fetch subscription plans');
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCreatePlan() {
  const { sdk } = useGymSdk();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePlanDto) => {
      try {
        // TODO: Replace with actual SDK call
        // const result = await sdk.adminSubscriptions.createPlan(data);
        // return result;
        
        // Mock implementation
        console.log('Creating plan:', data);
        return { id: Date.now().toString(), ...data, createdAt: new Date(), updatedAt: new Date() };
      } catch (error: any) {
        throw new Error(error.message || 'Failed to create plan');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscription-plans'] });
      toast.success('Plan created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create plan');
    },
  });
}

export function useUpdatePlan() {
  const { sdk } = useGymSdk();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePlanDto }) => {
      try {
        // TODO: Replace with actual SDK call
        // const result = await sdk.adminSubscriptions.updatePlan(id, data);
        // return result;
        
        // Mock implementation
        console.log('Updating plan:', id, data);
        return { id, ...data, updatedAt: new Date() };
      } catch (error: any) {
        throw new Error(error.message || 'Failed to update plan');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscription-plans'] });
      toast.success('Plan updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update plan');
    },
  });
}

export function useDeletePlan() {
  const { sdk } = useGymSdk();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        // TODO: Replace with actual SDK call
        // await sdk.adminSubscriptions.deletePlan(id);
        
        // Mock implementation
        console.log('Deleting plan:', id);
      } catch (error: any) {
        throw new Error(error.message || 'Failed to delete plan');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscription-plans'] });
      toast.success('Plan deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete plan');
    },
  });
}