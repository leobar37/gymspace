import { atom, useAtom } from 'jotai';

// Onboarding state interface
interface OnboardingState {
  // Owner data
  ownerData: {
    name: string;
    email: string;
    phone: string;
    password: string;
  } | null;
  
  // Organization data
  organizationData: {
    name: string;
    country: string;
    currency: string;
    timezone: string;
  } | null;
  
  
  // Gym data
  gymData: {
    name: string;
    address: string;
    phone: string;
    description?: string;
    logo?: string;
    coverPhoto?: string;
  } | null;
  
  // Email verification
  emailVerified: boolean;
  verificationCode: string | null;
  
  // Temporary auth tokens (stored during registration, used after verification)
  tempAuthTokens: {
    accessToken: string;
    refreshToken: string;
  } | null;
  
  // Collaborator invitation
  invitationToken: string | null;
  invitationData: any | null;
}

// Initial state
const initialState: OnboardingState = {
  ownerData: null,
  organizationData: null,
  gymData: null,
  emailVerified: false,
  verificationCode: null,
  tempAuthTokens: null,
  invitationToken: null,
  invitationData: null,
};

// Atoms
const onboardingStateAtom = atom<OnboardingState>(initialState);

// Custom hook for onboarding state
export function useOnboardingStore() {
  const [state, setState] = useAtom(onboardingStateAtom);

  return {
    // State
    ...state,
    
    // Actions
    setOwnerData: (data: OnboardingState['ownerData']) => {
      setState((prev) => ({ ...prev, ownerData: data }));
    },
    
    setOrganizationData: (data: OnboardingState['organizationData']) => {
      setState((prev) => ({ ...prev, organizationData: data }));
    },
    
    
    setGymData: (data: OnboardingState['gymData']) => {
      setState((prev) => ({ ...prev, gymData: data }));
    },
    
    setEmailVerified: (verified: boolean) => {
      setState((prev) => ({ ...prev, emailVerified: verified }));
    },
    
    setVerificationCode: (code: string) => {
      setState((prev) => ({ ...prev, verificationCode: code }));
    },
    
    setTempAuthTokens: (tokens: OnboardingState['tempAuthTokens']) => {
      setState((prev) => ({ ...prev, tempAuthTokens: tokens }));
    },
    
    setInvitationToken: (token: string) => {
      setState((prev) => ({ ...prev, invitationToken: token }));
    },
    
    setInvitationData: (data: any) => {
      setState((prev) => ({ ...prev, invitationData: data }));
    },
    
    resetOnboarding: () => {
      setState(initialState);
    },
  };
}