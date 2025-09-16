import { SubscriptionPlan } from './subscriptions';

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

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponseDto {
  success: boolean;
  message: string;
}

export interface RequestPasswordResetDto {
  email: string;
}

export interface RequestPasswordResetResponseDto {
  success: boolean;
  message: string;
}

export interface VerifyResetCodeDto {
  email: string;
  code: string;
}

export interface VerifyResetCodeResponseDto {
  resetToken: string;
  expiresIn: number;
}

export interface ResetPasswordDto {
  resetToken: string;
  newPassword: string;
}

export interface ResetPasswordResponseDto {
  success: boolean;
  message: string;
}

export interface ResendResetCodeDto {
  email: string;
}

export interface ResendResetCodeResponseDto {
  success: boolean;
  message: string;
}

export interface RegisterCollaboratorDto {
  invitationToken: string;
  name: string;
  phone: string;
  password: string;
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
  subscription?: {
    id: string;
    organizationId: string;
    subscriptionPlanId: string;
    subscriptionPlan?: {
      id: string;
      name: string;
      price: any;
      billingFrequency: string;
      maxGyms: number;
      maxClientsPerGym: number;
      maxUsersPerGym: number;
      features: any;
      description?: string;
    };
    status: string;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
  };
  permissions: string[];
  isAuthenticated: boolean;
}