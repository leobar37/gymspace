import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useGymSdk } from '@/providers/GymSdkProvider';

// Query keys factory pattern for better type safety and organization
export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
  gyms: () => [...authKeys.all, 'gyms'] as const,
  currentGym: (gymId: string) => [...authKeys.gyms(), gymId] as const,
};

export const useAuthController = () => {
  const { sdk, setAuthToken, setCurrentGymId, clearAuth } = useGymSdk();
  const queryClient = useQueryClient();

  // Get current user with optimized caching
  const userQuery = useQuery({
    queryKey: authKeys.user(),
    queryFn: async () => {
      // This would be replaced with actual SDK call
      // For now, returning mock data
      return {
        id: '1',
        email: 'user@example.com',
        name: 'John Doe',
      };
    },
    // Override default staleTime for user data (less frequent changes)
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Keep user data in cache longer
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Get user's gyms
  const gymsQuery = useQuery({
    queryKey: authKeys.gyms(),
    queryFn: async () => {
      // This would call sdk.gyms.list()
      return [];
    },
    enabled: !!userQuery.data, // Only fetch if user is loaded
    // Use default staleTime (2 minutes)
  });

  // Login mutation with cache updates
  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await sdk.auth.login(credentials);
      return response;
    },
    onSuccess: async (data) => {
      // Update auth state
      await setAuthToken(data.data.accessToken);
      
      // Invalidate and refetch user-related queries
      await queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
    onError: (error) => {
      console.error('Login failed:', error);
    },
  });

  // Logout mutation with cache cleanup
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await clearAuth();
    },
    onSuccess: () => {
      // Remove all auth-related data from cache
      queryClient.removeQueries({ queryKey: authKeys.all });
      
      // Clear all other cached data
      queryClient.clear();
    },
  });

  // Prefetch user data (useful for navigation)
  const prefetchUserData = async () => {
    await queryClient.prefetchQuery({
      queryKey: authKeys.user(),
      queryFn: async () => {
        // Fetch user data
        return {};
      },
      // Data will be cached for gcTime (10 minutes by default)
    });
  };

  // Set query data optimistically
  const updateUserOptimistically = (updates: Partial<any>) => {
    queryClient.setQueryData(authKeys.user(), (old: any) => ({
      ...old,
      ...updates,
    }));
  };

  return {
    // Queries
    user: userQuery.data,
    isLoadingUser: userQuery.isLoading,
    userError: userQuery.error,
    
    gyms: gymsQuery.data,
    isLoadingGyms: gymsQuery.isLoading,
    
    // Mutations
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    
    // Utility functions
    prefetchUserData,
    updateUserOptimistically,
    
    // Cache management
    invalidateUser: () => queryClient.invalidateQueries({ queryKey: authKeys.user() }),
    invalidateGyms: () => queryClient.invalidateQueries({ queryKey: authKeys.gyms() }),
  };
};