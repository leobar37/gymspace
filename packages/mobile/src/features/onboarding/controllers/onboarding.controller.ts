import { useSDK } from '@/shared/hooks/useSDK';
import { gymAtom, userAtom } from '@/shared/stores/auth.store';
import {
  CompleteGuidedSetupData,
  ConfigureFeaturesData,
  OnboardingStep,
  StartOnboardingData,
  UpdateGymSettingsData
} from '@gymspace/sdk';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useSetAtom } from 'jotai';

export const useOnboardingController = () => {
  const { gymSpaceSDK } = useSDK();
  const queryClient = useQueryClient();
  const router = useRouter();
  const setUser = useSetAtom(userAtom);
  const setGym = useSetAtom(gymAtom);

  // Start onboarding mutation
  const startOnboardingMutation = useMutation({
    mutationFn: (data: StartOnboardingData) => gymSpaceSDK.onboarding.start(data),
    onSuccess: (response) => {
      // Store user and gym info
      setUser({
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        userType: response.user.userType,
      });
      
      setGym({
        id: response.gym.id,
        name: response.gym.name,
        organizationId: response.organization.id,
      });

      // Set gym context for SDK
      gymSpaceSDK.setGymId(response.gym.id);

      // Cache onboarding status
      queryClient.setQueryData(
        ['onboarding', 'status', response.gym.id],
        response.onboardingStatus
      );

      // Navigate to next step
      router.push('/onboarding/gym-settings');
    },
    onError: (error) => {
      console.error('Failed to start onboarding:', error);
    },
  });

  // Update gym settings mutation
  const updateGymSettingsMutation = useMutation({
    mutationFn: (data: UpdateGymSettingsData) => gymSpaceSDK.onboarding.updateGymSettings(data),
    onSuccess: (response) => {
      // Update cached onboarding status
      queryClient.setQueryData(
        ['onboarding', 'status', response.gym.id],
        response.onboardingStatus
      );

      // Navigate to next step
      router.push('/onboarding/configure-features');
    },
    onError: (error) => {
      console.error('Failed to update gym settings:', error);
    },
  });

  // Configure features mutation
  const configureFeaturesMutation = useMutation({
    mutationFn: (data: ConfigureFeaturesData) => gymSpaceSDK.onboarding.configureFeatures(data),
    onSuccess: (response) => {
      // Update cached onboarding status
      queryClient.setQueryData(
        ['onboarding', 'status', response.gym.id],
        response.onboardingStatus
      );

      // Navigate to completion screen
      router.push('/onboarding/complete');
    },
    onError: (error) => {
      console.error('Failed to configure features:', error);
    },
  });

  // Complete setup mutation
  const completeSetupMutation = useMutation({
    mutationFn: (data: CompleteGuidedSetupData) => gymSpaceSDK.onboarding.completeSetup(data),
    onSuccess: (response) => {
      // Update cached onboarding status
      queryClient.setQueryData(
        ['onboarding', 'status', response.onboardingStatus.gymId],
        response.onboardingStatus
      );

      // Navigate to dashboard
      router.replace('/(authenticated)/(tabs)/dashboard');
    },
    onError: (error) => {
      console.error('Failed to complete setup:', error);
    },
  });

  // Get onboarding status query
  const useOnboardingStatus = (gymId: string | undefined) => {
    return useQuery({
      queryKey: ['onboarding', 'status', gymId],
      queryFn: () => gymSpaceSDK.onboarding.getStatus(gymId!),
      enabled: !!gymId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Helper functions
  const getNextStep = (currentStep: OnboardingStep): string => {
    switch (currentStep) {
      case OnboardingStep.ACCOUNT_CREATED:
        return '/onboarding/gym-settings';
      case OnboardingStep.GYM_SETTINGS:
        return '/onboarding/configure-features';
      case OnboardingStep.FEATURES_CONFIGURED:
        return '/onboarding/complete';
      case OnboardingStep.COMPLETED:
        return '/(authenticated)/(tabs)/dashboard';
      default:
        return '/onboarding/start';
    }
  };

  const canSkipStep = (step: OnboardingStep): boolean => {
    // Only features configuration can be skipped with defaults
    return step === OnboardingStep.FEATURES_CONFIGURED;
  };

  return {
    // Mutations
    startOnboarding: startOnboardingMutation.mutate,
    isStarting: startOnboardingMutation.isPending,
    startError: startOnboardingMutation.error,

    updateGymSettings: updateGymSettingsMutation.mutate,
    isUpdatingSettings: updateGymSettingsMutation.isPending,
    settingsError: updateGymSettingsMutation.error,

    configureFeatures: configureFeaturesMutation.mutate,
    isConfiguringFeatures: configureFeaturesMutation.isPending,
    featuresError: configureFeaturesMutation.error,

    completeSetup: completeSetupMutation.mutate,
    isCompletingSetup: completeSetupMutation.isPending,
    completeError: completeSetupMutation.error,

    // Query
    useOnboardingStatus,

    // Helpers
    getNextStep,
    canSkipStep,
  };
};