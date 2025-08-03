import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useGymSdk } from '../../../providers/GymSdkProvider';
import { router } from 'expo-router';
import { useAtom } from 'jotai';
import { currentGymAtom } from '../../../store/atoms';

// Query keys
export const onboardingKeys = {
  all: ['onboarding'] as const,
  organization: () => [...onboardingKeys.all, 'organization'] as const,
  subscriptionPlans: () => [...onboardingKeys.all, 'subscriptionPlans'] as const,
  invitations: () => [...onboardingKeys.all, 'invitations'] as const,
};

// Types
interface CreateOwnerData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

interface CreateOrganizationData {
  name: string;
  subscriptionPlanId: string;
  country: string;
  currency: string;
  timezone: string;
}

interface CreateGymData {
  name: string;
  address: string;
  phone: string;
  description?: string;
}

export const useOnboardingController = () => {
  const { sdk, setAuthToken, setCurrentGymId } = useGymSdk();
  const queryClient = useQueryClient();
  const [, setCurrentGym] = useAtom(currentGymAtom);

  // Get subscription plans
  const subscriptionPlansQuery = useQuery({
    queryKey: onboardingKeys.subscriptionPlans(),
    queryFn: async () => {
      // Mock data for now - replace with actual SDK call
      return [
        { id: '1', name: 'Básico', price: 29.99, maxGyms: 1, maxClientsPerGym: 100 },
        { id: '2', name: 'Premium', price: 59.99, maxGyms: 3, maxClientsPerGym: 500 },
        { id: '3', name: 'Enterprise', price: 99.99, maxGyms: -1, maxClientsPerGym: -1 },
      ];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // Owner registration mutation
  const registerOwnerMutation = useMutation({
    mutationFn: async (data: CreateOwnerData) => {
      const response = await sdk.auth.register({
        ...data,
        userType: 'owner',
      });
      return response;
    },
    onSuccess: async (response) => {
      // Set auth token after successful registration
      await setAuthToken(response.data.accessToken);
    },
  });

  // Create organization mutation
  const createOrganizationMutation = useMutation({
    mutationFn: async (data: CreateOrganizationData) => {
      const response = await sdk.organizations.create(data);
      return response;
    },
  });

  // Create gym mutation
  const createGymMutation = useMutation({
    mutationFn: async (data: CreateGymData) => {
      const response = await sdk.gyms.create(data);
      return response;
    },
    onSuccess: async (response) => {
      // Set current gym and update global state
      const gymId = response.data.id;
      await setCurrentGymId(gymId);
      setCurrentGym(response.data);
      
      // Navigate to main app
      router.replace('/(app)');
    },
  });

  // Complete onboarding flow
  const completeOnboarding = async (
    ownerData: CreateOwnerData,
    organizationData: CreateOrganizationData,
    gymData: CreateGymData
  ) => {
    try {
      // Step 1: Register owner
      await registerOwnerMutation.mutateAsync(ownerData);
      
      // Step 2: Create organization
      await createOrganizationMutation.mutateAsync(organizationData);
      
      // Step 3: Create first gym
      await createGymMutation.mutateAsync(gymData);
      
      // Clear onboarding cache
      queryClient.removeQueries({ queryKey: onboardingKeys.all });
      
      return true;
    } catch (error) {
      console.error('Onboarding failed:', error);
      throw error;
    }
  };

  // Check invitation for collaborator onboarding
  const checkInvitationMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await sdk.invitations.check(token);
      return response;
    },
  });

  // Accept invitation mutation
  const acceptInvitationMutation = useMutation({
    mutationFn: async (data: { token: string; userData: CreateOwnerData }) => {
      const response = await sdk.invitations.accept({
        token: data.token,
        ...data.userData,
      });
      return response;
    },
    onSuccess: async (response) => {
      // Set auth token and gym
      await setAuthToken(response.data.accessToken);
      await setCurrentGymId(response.data.gymId);
      
      // Navigate to main app
      router.replace('/(app)');
    },
  });

  return {
    // Queries
    subscriptionPlans: subscriptionPlansQuery.data,
    isLoadingPlans: subscriptionPlansQuery.isLoading,
    
    // Mutations
    registerOwner: registerOwnerMutation.mutate,
    isRegisteringOwner: registerOwnerMutation.isPending,
    
    createOrganization: createOrganizationMutation.mutate,
    isCreatingOrganization: createOrganizationMutation.isPending,
    
    createGym: createGymMutation.mutate,
    isCreatingGym: createGymMutation.isPending,
    
    completeOnboarding,
    isOnboarding: registerOwnerMutation.isPending || 
                  createOrganizationMutation.isPending || 
                  createGymMutation.isPending,
    
    // Collaborator onboarding
    checkInvitation: checkInvitationMutation.mutate,
    isCheckingInvitation: checkInvitationMutation.isPending,
    
    acceptInvitation: acceptInvitationMutation.mutate,
    isAcceptingInvitation: acceptInvitationMutation.isPending,
  };
};