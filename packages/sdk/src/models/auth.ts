export interface RegisterOwnerDto {
  name: string;
  email: string;
  phone: string;
  password: string;
  organizationName: string;
  subscriptionPlanId: string;
  country?: string;
  currency?: string;
  timezone?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponseDto {
  access_token: string;
  refresh_token: string;
  user: any;
  redirectPath: string;
}

export interface VerifyEmailDto {
  email: string;
  code: string;
}

export interface ResendVerificationDto {
  email: string;
}

export interface CompleteOnboardingDto {
  // Owner data
  name: string;
  email: string;
  phone: string;
  password: string;
  // Organization data
  organizationName: string;
  country: string;
  currency: string;
  // Subscription
  subscriptionPlanId: string;
  // First gym
  gym: {
    name: string;
    address: string;
    phone: string;
    description?: string;
    logo?: string;
    coverPhoto?: string;
  };
  // Email verification
  verificationCode: string;
}

export interface RegisterCollaboratorDto {
  invitationToken: string;
  name: string;
  phone: string;
  password: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billingFrequency: string;
  maxGyms: number;
  maxClientsPerGym: number;
  maxUsersPerGym: number;
  features: any;
  description?: string;
}

export interface OnboardingCompleteResponse {
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
  redirectPath: string;
}

export interface InvitationValidationResponse {
  valid: boolean;
  invitation: {
    id: string;
    gymName: string;
    gymLogo?: string;
    gymAddress: string;
    inviterName: string;
    inviterRole: string;
    role: string;
    permissions: string[];
    expiresAt: Date;
    email: string;
  };
}

export interface CurrentSessionResponse {
  user: {
    id: string;
    email: string;
    name: string;
    phone?: string;
    userType: string;
    emailVerifiedAt?: Date;
  };
  gym?: {
    id: string;
    organizationId: string;
    name: string;
    address?: string;
    description?: string;
    phone?: string;
    gymCode: string;
    profileAssetId?: string;
    coverAssetId?: string;
    evaluationStructure?: Record<string, any>;
  };
  organization?: {
    id: string;
    ownerUserId: string;
    name: string;
    subscriptionPlanId: string;
    subscriptionStatus: string;
    subscriptionStart: Date;
    subscriptionEnd: Date;
    country: string;
    currency: string;
    timezone: string;
    settings?: Record<string, any>;
  };
  permissions: string[];
  isAuthenticated: boolean;
}