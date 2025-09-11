import { UUID, Permission } from './types';
import { UserType, CollaboratorStatus } from './enums';

export interface IUser {
  id: UUID;
  email: string;
  name: string;
  phone?: string;
  userType: UserType;
  emailVerifiedAt?: Date;
}

export interface IOrganization {
  id: UUID;
  ownerUserId: UUID;
  name: string;
  subscriptionPlanId: UUID;
  subscriptionStatus: string;
  subscriptionStart: Date;
  subscriptionEnd: Date;
  country: string;
  currency: string;
  timezone: string;
  settings?: Record<string, any>;
}

export interface IGym {
  id: UUID;
  organizationId: UUID;
  name: string;
  address?: string;
  description?: string;
  phone?: string;
  gymCode: string;
  profileAssetId?: UUID;
  coverAssetId?: UUID;
  evaluationStructure?: Record<string, any>;
}

export interface ICollaborator {
  id: UUID;
  userId: UUID;
  gymId: UUID;
  roleId: UUID;
  status: CollaboratorStatus;
  hiredDate?: Date;
  invitationId?: UUID;
  profileAssetId?: UUID;
  coverAssetId?: UUID;
  description?: string;
  specialties?: string[];
}

export interface IRole {
  id: UUID;
  name: string;
  permissions: Permission[];
  description?: string;
  canManageEvaluations: boolean;
}

export interface ISubscriptionPlan {
  id: UUID;
  name: string;
  price: any;
  billingFrequency: string;
  maxGyms: number;
  maxClientsPerGym: number;
  maxUsersPerGym: number;
  features: any;
  description?: string;
}

export interface ISubscription {
  id: UUID;
  organizationId: UUID;
  subscriptionPlanId: UUID;
  subscriptionPlan?: ISubscriptionPlan;
  status: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

export interface IRequestContext {
  user: IUser;
  gym?: IGym;
  organization?: IOrganization;
  subscription?: ISubscription;
  permissions: Permission[];
  hasPermission(permission: Permission): boolean;
  canAccess(resource: string, action: string): boolean;
  getGymId(): UUID | undefined;
  getOrganizationId(): UUID | undefined;
  getUserId(): UUID;
}

// Type aliases for convenience
export type Organization = IOrganization;
export type User = IUser;
export type Gym = IGym;
export type Collaborator = ICollaborator;
export type Role = IRole;
