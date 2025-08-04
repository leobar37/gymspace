export interface StartOnboardingData {
  name: string;
  email: string;
  phone: string;
  password: string;
  organizationName: string;
  country: string;
  currency: string;
  timezone: string;
  subscriptionPlanId: string;
  verificationCode: string;
}

export interface StartOnboardingResponse {
  success: boolean;
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    userType: string;
  };
  organization: {
    id: string;
    name: string;
  };
  gym: {
    id: string;
    name: string;
  };
  onboardingStatus: OnboardingStatus;
}

export interface BusinessHours {
  open: string;
  close: string;
  closed: boolean;
}

export interface WeeklySchedule {
  monday: BusinessHours;
  tuesday: BusinessHours;
  wednesday: BusinessHours;
  thursday: BusinessHours;
  friday: BusinessHours;
  saturday: BusinessHours;
  sunday: BusinessHours;
}

export interface Amenities {
  hasParking: boolean;
  hasShowers: boolean;
  hasLockers: boolean;
  hasPool: boolean;
  hasSauna: boolean;
  hasWifi: boolean;
  hasChildcare: boolean;
  hasCafeteria: boolean;
}

export interface SocialMedia {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  website?: string;
}

export interface UpdateGymSettingsData {
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
  description?: string;
  amenities: Amenities;
  socialMedia?: SocialMedia;
  logo?: string;
  coverPhoto?: string;
  primaryColor?: string;
}

export interface ClientManagementFeatures {
  enabled: boolean;
  requireDocumentId: boolean;
  enablePhotos: boolean;
  trackEmergencyContacts: boolean;
  trackMedicalConditions: boolean;
}

export interface MembershipManagementFeatures {
  enabled: boolean;
  allowCustomPricing: boolean;
  allowContractFreezing: boolean;
  expiryWarningDays: number;
  autoRenewalReminders: boolean;
}

export interface CheckInSystemFeatures {
  enabled: boolean;
  requireActiveContract: boolean;
  trackCheckInTime: boolean;
  allowMultiplePerDay: boolean;
}

export interface EvaluationSystemFeatures {
  enabled: boolean;
  trackMeasurements: boolean;
  trackBodyComposition: boolean;
  trackPerformance: boolean;
  defaultFrequencyDays: number;
}

export interface LeadManagementFeatures {
  enabled: boolean;
  publicCatalogListing: boolean;
  enableOnlineForm: boolean;
  autoAssignLeads: boolean;
}

export interface NotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  welcomeEmails: boolean;
  contractExpiryAlerts: boolean;
  evaluationReminders: boolean;
}

export interface ConfigureFeaturesData {
  gymId: string;
  clientManagement: ClientManagementFeatures;
  membershipManagement: MembershipManagementFeatures;
  checkInSystem: CheckInSystemFeatures;
  evaluationSystem: EvaluationSystemFeatures;
  leadManagement: LeadManagementFeatures;
  notifications: NotificationSettings;
}

export interface CompleteGuidedSetupData {
  gymId: string;
}

export enum OnboardingStep {
  ACCOUNT_CREATED = 'account_created',
  GYM_SETTINGS = 'gym_settings',
  FEATURES_CONFIGURED = 'features_configured',
  COMPLETED = 'completed',
}

export interface OnboardingStatus {
  organizationId: string;
  gymId: string;
  currentStep: OnboardingStep;
  accountCreated: boolean;
  gymSettingsCompleted: boolean;
  featuresConfigured: boolean;
  isCompleted: boolean;
  nextAction: string;
  completionPercentage: number;
}

export interface OnboardingResponse {
  success: boolean;
  gym?: any;
  onboardingStatus: OnboardingStatus;
  message?: string;
}