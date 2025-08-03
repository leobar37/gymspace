# TypeScript Types

Complete TypeScript type definitions for the GymSpace SDK.

## Core Types

```typescript
// Base entity type
interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdByUserId?: string;
  updatedByUserId?: string;
}

// Pagination types
interface PaginationParams {
  page?: number;
  limit?: number;
  orderBy?: string | string[];
  order?: 'asc' | 'desc' | ('asc' | 'desc')[];
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Common types
type UUID = string;
type ISODateString = string;
type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';
type Timezone = string; // IANA timezone
```

## User Types

```typescript
interface User extends BaseEntity {
  email: string;
  fullName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: Date;
  metadata?: Record<string, any>;
  roles?: UserRole[];
}

interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  gymId?: string;
  role: Role;
  assignedAt: Date;
}

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  isSystem: boolean;
}

interface Permission {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: string;
}

interface CreateUserDTO {
  email: string;
  fullName: string;
  phoneNumber?: string;
  password?: string;
  role?: string;
  sendInviteEmail?: boolean;
  metadata?: Record<string, any>;
}

interface UpdateUserDTO {
  fullName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  metadata?: Record<string, any>;
}
```

## Gym Types

```typescript
interface Gym extends BaseEntity {
  name: string;
  slug: string;
  email: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  timezone: Timezone;
  currency: Currency;
  logo?: string;
  website?: string;
  description?: string;
  settings: GymSettings;
  features: string[];
  isActive: boolean;
  parentGymId?: string;
}

interface GymSettings {
  general: GeneralSettings;
  membership: MembershipSettings;
  billing: BillingSettings;
  notifications: NotificationSettings;
  access: AccessSettings;
  branding: BrandingSettings;
}

interface GeneralSettings {
  timezone: Timezone;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  currency: Currency;
  language: string;
}

interface MembershipSettings {
  allowOnlineSignup: boolean;
  requireEmailVerification: boolean;
  requireIdVerification: boolean;
  defaultMembershipDuration: number;
  gracePeriodDays: number;
  allowFreeze: boolean;
  maxFreezeDays: number;
  minContractDuration: number;
}

interface BusinessHours {
  [day: string]: {
    open: string; // HH:MM format
    close: string;
    closed?: boolean;
  };
}

interface CreateGymDTO {
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  timezone: Timezone;
  currency: Currency;
  settings?: Partial<GymSettings>;
}
```

## Member Types

```typescript
interface Member extends BaseEntity {
  clientNumber: string;
  userId: string;
  gymId: string;
  personalInfo: PersonalInfo;
  contactInfo: ContactInfo;
  emergencyContact: EmergencyContact;
  healthInfo?: HealthInfo;
  preferences?: MemberPreferences;
  status: MemberStatus;
  joinedAt: Date;
  lastVisitAt?: Date;
  tags?: string[];
  user?: User;
  contracts?: Contract[];
}

interface PersonalInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender?: Gender;
  nationalId?: string;
  photoUrl?: string;
}

interface ContactInfo {
  email: string;
  phoneNumber: string;
  alternatePhone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

interface EmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
  alternatePhone?: string;
}

interface HealthInfo {
  bloodType?: string;
  allergies?: string[];
  medicalConditions?: string[];
  medications?: string[];
  emergencyNotes?: string;
  physicalLimitations?: string[];
}

interface MemberPreferences {
  communicationPreferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  trainingPreferences?: {
    preferredTime?: 'morning' | 'afternoon' | 'evening';
    goals?: string[];
    interests?: string[];
  };
}

type MemberStatus = 'active' | 'inactive' | 'suspended';
type Gender = 'male' | 'female' | 'other';

interface CreateMemberDTO {
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: Date | ISODateString;
    gender?: Gender;
    nationalId?: string;
  };
  contactInfo: {
    email: string;
    phoneNumber: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phoneNumber: string;
  };
  createUser?: boolean;
  sendWelcomeEmail?: boolean;
}
```

## Contract Types

```typescript
interface Contract extends BaseEntity {
  contractNumber: string;
  gymClientId: string;
  planId: string;
  status: ContractStatus;
  startDate: Date;
  endDate?: Date;
  billingCycle: BillingCycle;
  price: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  autoRenew: boolean;
  nextBillingDate?: Date;
  cancellationReason?: string;
  cancellationDate?: Date;
  freezeStartDate?: Date;
  freezeEndDate?: Date;
  metadata?: Record<string, any>;
  gymClient?: Member;
  plan?: ContractPlan;
  payments?: Payment[];
}

interface ContractPlan extends BaseEntity {
  name: string;
  description?: string;
  price: number;
  currency: Currency;
  duration: number; // days
  billingCycle: BillingCycle;
  features: string[];
  maxMembers?: number;
  isActive: boolean;
  gymId: string;
}

type ContractStatus = 'pending' | 'active' | 'suspended' | 'cancelled' | 'expired';
type BillingCycle = 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'custom';
type PaymentMethod = 'credit_card' | 'debit_card' | 'bank_transfer' | 'cash' | 'other';

interface CreateContractDTO {
  gymClientId: string;
  planId: string;
  startDate: Date | ISODateString;
  paymentMethod: PaymentMethod;
  autoRenew?: boolean;
  paymentDetails?: {
    cardToken?: string;
    saveCard?: boolean;
  };
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
    reason?: string;
  };
}
```

## Staff Types

```typescript
interface Staff extends BaseEntity {
  userId: string;
  gymId: string;
  employeeId: string;
  role: StaffRole;
  department?: string;
  position: string;
  employmentType: EmploymentType;
  startDate: Date;
  endDate?: Date;
  salary?: number;
  hourlyRate?: number;
  status: StaffStatus;
  permissions: string[];
  schedule?: StaffSchedule;
  user?: User;
}

type StaffRole = 'admin' | 'manager' | 'trainer' | 'receptionist' | 'maintenance' | 'other';
type EmploymentType = 'full_time' | 'part_time' | 'contractor';
type StaffStatus = 'active' | 'inactive' | 'on_leave';

interface StaffSchedule {
  type: 'fixed' | 'flexible' | 'shift';
  weeklyHours: number;
  defaultShifts?: {
    [day: string]: {
      start: string;
      end: string;
    };
  };
  shifts?: Shift[];
}

interface Shift {
  id: string;
  staffId: string;
  date: Date;
  startTime: string;
  endTime: string;
  breakMinutes?: number;
  location?: string;
  notes?: string;
}
```

## Asset Types

```typescript
interface Asset extends BaseEntity {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  metadata?: AssetMetadata;
  tags?: string[];
  entityType?: string;
  entityId?: string;
  uploadedBy: string;
  isPublic: boolean;
  expiresAt?: Date;
  gymId: string;
}

interface AssetMetadata {
  width?: number;
  height?: number;
  duration?: number;
  format?: string;
  description?: string;
  alt?: string;
  [key: string]: any;
}

interface UploadAssetDTO {
  file: File | Blob;
  filename?: string;
  tags?: string[];
  metadata?: AssetMetadata;
  entityType?: string;
  entityId?: string;
  isPublic?: boolean;
  expiresAt?: Date | ISODateString;
}
```

## Activity Types

```typescript
interface Activity extends BaseEntity {
  type: ActivityType;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  gymId: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

type ActivityType = 
  | 'member_checkin'
  | 'member_checkout'
  | 'contract_created'
  | 'contract_cancelled'
  | 'payment_processed'
  | 'user_login'
  | 'user_logout'
  | 'settings_updated'
  | 'staff_clock_in'
  | 'staff_clock_out';

interface CheckIn extends BaseEntity {
  memberId: string;
  gymId: string;
  checkInTime: Date;
  checkOutTime?: Date;
  method: CheckInMethod;
  location?: string;
  member?: Member;
}

type CheckInMethod = 'qr_code' | 'card' | 'biometric' | 'manual';
```

## Payment Types

```typescript
interface Payment extends BaseEntity {
  contractId: string;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  method: PaymentMethod;
  transactionId?: string;
  processedAt?: Date;
  failureReason?: string;
  metadata?: Record<string, any>;
  contract?: Contract;
}

type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

interface ProcessPaymentDTO {
  amount: number;
  paymentMethod: PaymentMethod;
  cardToken?: string;
  saveCard?: boolean;
  metadata?: Record<string, any>;
}
```

## SDK Configuration Types

```typescript
interface SDKConfig {
  apiUrl: string;
  apiKey?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  gymId?: string;
  timeout?: number;
  retry?: RetryConfig;
  headers?: Record<string, string>;
}

interface RetryConfig {
  maxAttempts: number;
  backoff: 'exponential' | 'linear';
  initialDelay: number;
  maxDelay: number;
  retryableErrors: string[];
}
```