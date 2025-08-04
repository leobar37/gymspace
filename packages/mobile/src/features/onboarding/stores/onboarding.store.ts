import { atom } from 'jotai';
import { 
  BusinessHours, 
  WeeklySchedule, 
  Amenities, 
  SocialMedia,
  ClientManagementFeatures,
  MembershipManagementFeatures,
  CheckInSystemFeatures,
  EvaluationSystemFeatures,
  LeadManagementFeatures,
  NotificationSettings
} from '@gymspace/sdk';

// Default business hours
const defaultBusinessHours: BusinessHours = {
  open: '08:00',
  close: '22:00',
  closed: false,
};

const defaultWeeklySchedule: WeeklySchedule = {
  monday: defaultBusinessHours,
  tuesday: defaultBusinessHours,
  wednesday: defaultBusinessHours,
  thursday: defaultBusinessHours,
  friday: defaultBusinessHours,
  saturday: { ...defaultBusinessHours, open: '09:00', close: '20:00' },
  sunday: { ...defaultBusinessHours, open: '09:00', close: '18:00' },
};

// Registration form data
export interface RegistrationFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  organizationName: string;
  country: string;
  currency: string;
  timezone: string;
  subscriptionPlanId: string;
  verificationCode: string;
}

export const registrationFormAtom = atom<RegistrationFormData>({
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  organizationName: '',
  country: 'US',
  currency: 'USD',
  timezone: 'America/New_York',
  subscriptionPlanId: '',
  verificationCode: '',
});

// Gym settings form data
export interface GymSettingsFormData {
  gymId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  email: string;
  businessHours: WeeklySchedule;
  capacity: number;
  description: string;
  amenities: Amenities;
  socialMedia: SocialMedia;
  logo: string;
  coverPhoto: string;
  primaryColor: string;
}

export const gymSettingsFormAtom = atom<GymSettingsFormData>({
  gymId: '',
  name: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  phone: '',
  email: '',
  businessHours: defaultWeeklySchedule,
  capacity: 100,
  description: '',
  amenities: {
    hasParking: false,
    hasShowers: true,
    hasLockers: true,
    hasPool: false,
    hasSauna: false,
    hasWifi: true,
    hasChildcare: false,
    hasCafeteria: false,
  },
  socialMedia: {
    facebook: '',
    instagram: '',
    twitter: '',
    website: '',
  },
  logo: '',
  coverPhoto: '',
  primaryColor: '#FF6B6B',
});

// Feature configuration form data
export interface FeatureConfigurationFormData {
  gymId: string;
  clientManagement: ClientManagementFeatures;
  membershipManagement: MembershipManagementFeatures;
  checkInSystem: CheckInSystemFeatures;
  evaluationSystem: EvaluationSystemFeatures;
  leadManagement: LeadManagementFeatures;
  notifications: NotificationSettings;
}

export const featureConfigurationFormAtom = atom<FeatureConfigurationFormData>({
  gymId: '',
  clientManagement: {
    enabled: true,
    requireDocumentId: false,
    enablePhotos: true,
    trackEmergencyContacts: true,
    trackMedicalConditions: true,
  },
  membershipManagement: {
    enabled: true,
    allowCustomPricing: true,
    allowContractFreezing: true,
    expiryWarningDays: 30,
    autoRenewalReminders: true,
  },
  checkInSystem: {
    enabled: true,
    requireActiveContract: true,
    trackCheckInTime: true,
    allowMultiplePerDay: false,
  },
  evaluationSystem: {
    enabled: true,
    trackMeasurements: true,
    trackBodyComposition: true,
    trackPerformance: true,
    defaultFrequencyDays: 90,
  },
  leadManagement: {
    enabled: true,
    publicCatalogListing: true,
    enableOnlineForm: true,
    autoAssignLeads: false,
  },
  notifications: {
    emailEnabled: true,
    smsEnabled: false,
    welcomeEmails: true,
    contractExpiryAlerts: true,
    evaluationReminders: true,
  },
});

// Current step tracking
export const currentOnboardingStepAtom = atom<number>(1);

// Validation atoms
export const registrationFormValidationAtom = atom((get) => {
  const form = get(registrationFormAtom);
  const errors: Partial<Record<keyof RegistrationFormData, string>> = {};

  if (!form.name) errors.name = 'Name is required';
  if (!form.email) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Invalid email format';
  
  if (!form.phone) errors.phone = 'Phone is required';
  if (!form.password) errors.password = 'Password is required';
  else if (form.password.length < 8) errors.password = 'Password must be at least 8 characters';
  
  if (!form.confirmPassword) errors.confirmPassword = 'Please confirm your password';
  else if (form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match';
  
  if (!form.organizationName) errors.organizationName = 'Organization name is required';
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
});

export const gymSettingsFormValidationAtom = atom((get) => {
  const form = get(gymSettingsFormAtom);
  const errors: Partial<Record<keyof GymSettingsFormData, string>> = {};

  if (!form.name) errors.name = 'Gym name is required';
  if (!form.address) errors.address = 'Address is required';
  if (!form.city) errors.city = 'City is required';
  if (!form.state) errors.state = 'State is required';
  if (!form.postalCode) errors.postalCode = 'Postal code is required';
  if (!form.phone) errors.phone = 'Phone is required';
  if (!form.email) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Invalid email format';
  
  if (form.capacity < 1) errors.capacity = 'Capacity must be at least 1';

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
});

// Reset atoms
export const resetRegistrationFormAtom = atom(null, (get, set) => {
  set(registrationFormAtom, {
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
    country: 'US',
    currency: 'USD',
    timezone: 'America/New_York',
    subscriptionPlanId: '',
    verificationCode: '',
  });
});

export const resetAllOnboardingFormsAtom = atom(null, (get, set) => {
  set(resetRegistrationFormAtom);
  set(currentOnboardingStepAtom, 1);
});