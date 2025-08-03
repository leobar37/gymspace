import { atom } from 'jotai';

// Owner onboarding data
export interface OwnerOnboardingData {
  // Personal info
  name?: string;
  email?: string;
  
  // Contact info
  phone?: string;
  
  // Security
  password?: string;
  
  // Organization
  organizationName?: string;
  subscriptionPlanId?: string;
  country?: string;
  currency?: string;
  timezone?: string;
  
  // Gym
  gymName?: string;
  gymAddress?: string;
  gymPhone?: string;
  gymDescription?: string;
}

// Collaborator onboarding data
export interface CollaboratorOnboardingData {
  invitationToken?: string;
  invitationData?: {
    gymName: string;
    roleName: string;
    invitedBy: string;
  };
  
  // Personal info
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
}

// Onboarding type
export type OnboardingType = 'owner' | 'collaborator' | null;

// Atoms
export const onboardingTypeAtom = atom<OnboardingType>(null);

export const ownerOnboardingDataAtom = atom<OwnerOnboardingData>({});

export const collaboratorOnboardingDataAtom = atom<CollaboratorOnboardingData>({});

// Current step tracking
export const onboardingStepAtom = atom(0);

// Derived atoms
export const isOnboardingCompleteAtom = atom((get) => {
  const type = get(onboardingTypeAtom);
  
  if (type === 'owner') {
    const data = get(ownerOnboardingDataAtom);
    return !!(
      data.name &&
      data.email &&
      data.phone &&
      data.password &&
      data.organizationName &&
      data.subscriptionPlanId &&
      data.country &&
      data.currency &&
      data.timezone &&
      data.gymName &&
      data.gymAddress &&
      data.gymPhone
    );
  }
  
  if (type === 'collaborator') {
    const data = get(collaboratorOnboardingDataAtom);
    return !!(
      data.invitationToken &&
      data.name &&
      data.email &&
      data.phone &&
      data.password
    );
  }
  
  return false;
});

// Actions
export const updateOwnerDataAtom = atom(
  null,
  (get, set, updates: Partial<OwnerOnboardingData>) => {
    const current = get(ownerOnboardingDataAtom);
    set(ownerOnboardingDataAtom, { ...current, ...updates });
  }
);

export const updateCollaboratorDataAtom = atom(
  null,
  (get, set, updates: Partial<CollaboratorOnboardingData>) => {
    const current = get(collaboratorOnboardingDataAtom);
    set(collaboratorOnboardingDataAtom, { ...current, ...updates });
  }
);

export const resetOnboardingAtom = atom(null, (get, set) => {
  set(onboardingTypeAtom, null);
  set(ownerOnboardingDataAtom, {});
  set(collaboratorOnboardingDataAtom, {});
  set(onboardingStepAtom, 0);
});

// Navigation helpers
export const nextStepAtom = atom(null, (get, set) => {
  const currentStep = get(onboardingStepAtom);
  set(onboardingStepAtom, currentStep + 1);
});

export const previousStepAtom = atom(null, (get, set) => {
  const currentStep = get(onboardingStepAtom);
  if (currentStep > 0) {
    set(onboardingStepAtom, currentStep - 1);
  }
});