# Prisma Generated Types Reference

This document provides a comprehensive reference for all Prisma-generated types in the GymSpace API. These types are automatically generated from the Prisma schema and provide type-safe database operations.

## Table of Contents
- [Enums](#enums)
- [Model Types](#model-types)
- [Input Types](#input-types)
- [Select and Include Types](#select-and-include-types)
- [Usage Examples](#usage-examples)

## Importing Prisma Types

```typescript
import { PrismaClient, Prisma } from '@prisma/client';
// Import specific model types
import type { User, Gym, Organization } from '@prisma/client';
```

## Enums

All enums use lowercase values in TypeScript code to match the Prisma schema.

### UserType
```typescript
enum UserType {
  owner = 'owner',
  collaborator = 'collaborator'
}
```

### SubscriptionStatus
```typescript
enum SubscriptionStatus {
  active = 'active',
  inactive = 'inactive',
  expired = 'expired'
}
```

### CollaboratorStatus
```typescript
enum CollaboratorStatus {
  pending = 'pending',
  active = 'active',
  inactive = 'inactive'
}
```

### InvitationStatus
```typescript
enum InvitationStatus {
  pending = 'pending',
  accepted = 'accepted',
  expired = 'expired'
}
```

### ClientStatus
```typescript
enum ClientStatus {
  active = 'active',
  inactive = 'inactive'
}
```

### PlanStatus
```typescript
enum PlanStatus {
  active = 'active',
  inactive = 'inactive',
  archived = 'archived'
}
```

### ContractStatus
```typescript
enum ContractStatus {
  pending = 'pending',
  active = 'active',
  expiring_soon = 'expiring_soon',
  expired = 'expired',
  cancelled = 'cancelled'
}
```

### PaymentFrequency
```typescript
enum PaymentFrequency {
  monthly = 'monthly',
  quarterly = 'quarterly',
  annual = 'annual'
}
```

### AssetStatus
```typescript
enum AssetStatus {
  active = 'active',
  deleted = 'deleted'
}
```

### EvaluationType
```typescript
enum EvaluationType {
  initial = 'initial',
  progress = 'progress',
  final = 'final'
}
```

### EvaluationStatus
```typescript
enum EvaluationStatus {
  open = 'open',
  in_progress = 'in_progress',
  completed = 'completed',
  cancelled = 'cancelled'
}
```

### CommentType
```typescript
enum CommentType {
  progress_note = 'progress_note',
  phone_call = 'phone_call',
  meeting = 'meeting',
  reminder = 'reminder',
  other = 'other'
}
```

### AssetCategory
```typescript
enum AssetCategory {
  medical_document = 'medical_document',
  identification = 'identification',
  insurance = 'insurance',
  contract_copy = 'contract_copy',
  other = 'other'
}
```

### LeadStatus
```typescript
enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  INTERESTED = 'INTERESTED',
  CONVERTED = 'CONVERTED',
  LOST = 'LOST'
}
```

### ContractAssetType
```typescript
enum ContractAssetType {
  payment_receipt = 'payment_receipt',
  contract_document = 'contract_document',
  identification = 'identification',
  other = 'other'
}
```

### EvaluationAssetStage
```typescript
enum EvaluationAssetStage {
  initial = 'initial',
  progress = 'progress',
  final = 'final'
}
```

### EvaluationAssetCategory
```typescript
enum EvaluationAssetCategory {
  body_photo = 'body_photo',
  measurement_photo = 'measurement_photo',
  document = 'document',
  report = 'report',
  other = 'other'
}
```

## Model Types

Each Prisma model generates a TypeScript type with all fields properly typed.

### Core Models

#### User
```typescript
type User = {
  id: string;
  email: string;
  password: string | null;
  name: string;
  phone: string | null;
  userType: UserType;
  emailVerifiedAt: Date | null;
  createdByUserId: string | null;
  updatedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

#### Organization
```typescript
type Organization = {
  id: string;
  ownerUserId: string;
  name: string;
  subscriptionPlanId: string;
  subscriptionStatus: SubscriptionStatus;
  subscriptionStart: Date;
  subscriptionEnd: Date;
  country: string;
  currency: string;
  timezone: string;
  settings: Prisma.JsonValue | null;
  createdByUserId: string;
  updatedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

#### Gym
```typescript
type Gym = {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  phone: string | null;
  email: string | null;
  openingTime: string | null;
  closingTime: string | null;
  capacity: number | null;
  amenities: Prisma.JsonValue | null;
  settings: Prisma.JsonValue | null;
  isActive: boolean;
  gymCode: string;
  profileAssetId: string | null;
  coverAssetId: string | null;
  evaluationStructure: Prisma.JsonValue | null;
  catalogVisibility: boolean;
  catalogDescription: string | null;
  catalogImages: Prisma.JsonValue | null;
  catalogFeatured: boolean;
  catalogPriority: number;
  socialMedia: Prisma.JsonValue | null;
  createdByUserId: string;
  updatedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

#### GymClient
```typescript
type GymClient = {
  id: string;
  gymId: string;
  clientNumber: string;
  name: string;
  birthDate: Date | null;
  documentId: string | null;
  phone: string | null;
  email: string | null;
  status: ClientStatus;
  profileAssetId: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  medicalConditions: string | null;
  notes: string | null;
  createdByUserId: string;
  updatedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

#### Contract
```typescript
type Contract = {
  id: string;
  gymClientId: string;
  gymMembershipPlanId: string;
  startDate: Date;
  endDate: Date;
  basePrice: Prisma.Decimal;
  customPrice: Prisma.Decimal | null;
  finalAmount: Prisma.Decimal;
  currency: string;
  discountPercentage: Prisma.Decimal | null;
  discountAmount: Prisma.Decimal | null;
  status: ContractStatus;
  paymentFrequency: PaymentFrequency;
  notes: string | null;
  termsAndConditions: string | null;
  createdByUserId: string;
  updatedByUserId: string | null;
  approvedByUserId: string | null;
  approvedAt: Date | null;
  cancelledByUserId: string | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  gymId: string | null;
}
```

### Additional Models

#### SubscriptionPlan
```typescript
type SubscriptionPlan = {
  id: string;
  name: string;
  price: Prisma.Decimal;
  billingFrequency: string;
  maxGyms: number;
  maxClientsPerGym: number;
  maxUsersPerGym: number;
  features: Prisma.JsonValue;
  description: string | null;
  createdByUserId: string | null;
  updatedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

#### Role
```typescript
type Role = {
  id: string;
  name: string;
  permissions: Prisma.JsonValue;
  description: string | null;
  canManageEvaluations: boolean;
  createdByUserId: string | null;
  updatedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

#### Collaborator
```typescript
type Collaborator = {
  id: string;
  userId: string;
  gymId: string;
  roleId: string;
  status: CollaboratorStatus;
  hiredDate: Date | null;
  invitationId: string | null;
  profileAssetId: string | null;
  coverAssetId: string | null;
  description: string | null;
  specialties: Prisma.JsonValue | null;
  createdByUserId: string;
  updatedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

#### Invitation
```typescript
type Invitation = {
  id: string;
  gymId: string;
  email: string;
  roleId: string;
  token: string;
  status: InvitationStatus;
  invitedByUserId: string;
  expiresAt: Date;
  acceptedByUserId: string | null;
  acceptedAt: Date | null;
  createdByUserId: string;
  updatedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

#### GymMembershipPlan
```typescript
type GymMembershipPlan = {
  id: string;
  gymId: string;
  name: string;
  basePrice: Prisma.Decimal;
  currency: string;
  durationMonths: number;
  description: string | null;
  features: Prisma.JsonValue | null;
  termsAndConditions: string | null;
  allowsCustomPricing: boolean;
  maxEvaluations: number;
  includesAdvisor: boolean;
  showInCatalog: boolean;
  status: PlanStatus;
  createdByUserId: string;
  updatedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

#### Asset
```typescript
type Asset = {
  id: string;
  filename: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  entityType: string;
  entityId: string;
  uploadedByUserId: string;
  metadata: Prisma.JsonValue | null;
  status: AssetStatus;
  createdByUserId: string;
  updatedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

#### CheckIn
```typescript
type CheckIn = {
  id: string;
  gymClientId: string;
  gymId: string;
  timestamp: Date;
  registeredByUserId: string;
  notes: string | null;
  createdByUserId: string;
  updatedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

#### Evaluation
```typescript
type Evaluation = {
  id: string;
  gymClientId: string;
  contractId: string | null;
  advisorId: string | null;
  evaluationType: EvaluationType;
  status: EvaluationStatus;
  durationDays: number;
  plannedEndDate: Date;
  actualEndDate: Date | null;
  initialData: Prisma.JsonValue | null;
  finalData: Prisma.JsonValue | null;
  progressPercentage: Prisma.Decimal | null;
  goals: string | null;
  resultsSummary: string | null;
  createdByUserId: string;
  updatedByUserId: string | null;
  completedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  gymId: string | null;
}
```

#### EvaluationComment
```typescript
type EvaluationComment = {
  id: string;
  evaluationId: string;
  commentType: CommentType;
  comment: string;
  isPrivate: boolean;
  createdByUserId: string;
  updatedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

#### Lead
```typescript
type Lead = {
  id: string;
  gymId: string;
  name: string;
  email: string;
  phone: string;
  message: string | null;
  source: string | null;
  status: LeadStatus;
  metadata: Prisma.JsonValue | null;
  assignedToUserId: string | null;
  notes: string | null;
  convertedToClientId: string | null;
  convertedAt: Date | null;
  createdByUserId: string | null;
  updatedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

### Asset Relationship Models

#### ContractAsset
```typescript
type ContractAsset = {
  id: string;
  contractId: string;
  assetId: string;
  assetType: ContractAssetType;
  description: string | null;
  isRequired: boolean;
  createdByUserId: string;
  updatedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

#### ClientAsset
```typescript
type ClientAsset = {
  id: string;
  gymClientId: string;
  assetId: string;
  assetCategory: AssetCategory;
  description: string | null;
  isRequired: boolean;
  expirationDate: Date | null;
  createdByUserId: string;
  updatedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

#### EvaluationAsset
```typescript
type EvaluationAsset = {
  id: string;
  evaluationId: string;
  assetId: string;
  assetStage: EvaluationAssetStage;
  assetCategory: EvaluationAssetCategory;
  description: string | null;
  measurementType: string | null;
  createdByUserId: string;
  updatedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

#### CommentAsset
```typescript
type CommentAsset = {
  id: string;
  evaluationCommentId: string;
  assetId: string;
  description: string | null;
  createdByUserId: string;
  updatedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

## Input Types

Prisma generates input types for create, update, and filter operations.

### Create Input Types

```typescript
// Example: Creating a new user
type UserCreateInput = {
  id?: string;
  email: string;
  password?: string | null;
  name: string;
  phone?: string | null;
  userType: UserType;
  emailVerifiedAt?: Date | null;
  // ... audit fields
}

// Example: Creating a gym client
type GymClientCreateInput = {
  id?: string;
  clientNumber: string;
  name: string;
  birthDate?: Date | null;
  documentId?: string | null;
  phone?: string | null;
  email?: string | null;
  status: ClientStatus;
  // ... other fields
  gym: GymCreateNestedOneWithoutGymClientsInput;
}
```

### Update Input Types

```typescript
// Example: Updating a user
type UserUpdateInput = {
  email?: string;
  password?: string | null;
  name?: string;
  phone?: string | null;
  userType?: UserType;
  emailVerifiedAt?: Date | null;
  // ... audit fields
}

// Example: Updating a gym client
type GymClientUpdateInput = {
  clientNumber?: string;
  name?: string;
  birthDate?: Date | null;
  documentId?: string | null;
  phone?: string | null;
  email?: string | null;
  status?: ClientStatus;
  // ... other fields
}
```

### Where Input Types (Filters)

```typescript
// Example: Filtering users
type UserWhereInput = {
  AND?: UserWhereInput | UserWhereInput[];
  OR?: UserWhereInput[];
  NOT?: UserWhereInput | UserWhereInput[];
  id?: StringFilter | string;
  email?: StringFilter | string;
  name?: StringFilter | string;
  userType?: EnumUserTypeFilter | UserType;
  deletedAt?: DateTimeNullableFilter | Date | null;
  // ... other fields
}

// String filter operations
type StringFilter = {
  equals?: string;
  in?: string[];
  notIn?: string[];
  lt?: string;
  lte?: string;
  gt?: string;
  gte?: string;
  contains?: string;
  startsWith?: string;
  endsWith?: string;
  not?: NestedStringFilter | string;
}
```

## Select and Include Types

Prisma generates types for selecting specific fields and including relations.

### Select Types

```typescript
// Example: Selecting specific user fields
type UserSelect = {
  id?: boolean;
  email?: boolean;
  name?: boolean;
  userType?: boolean;
  createdAt?: boolean;
  updatedAt?: boolean;
  // Relations
  ownedOrganizations?: boolean | OrganizationFindManyArgs;
  collaborators?: boolean | CollaboratorFindManyArgs;
  // ... other relations
}
```

### Include Types

```typescript
// Example: Including relations
type UserInclude = {
  ownedOrganizations?: boolean | OrganizationFindManyArgs;
  collaborators?: boolean | CollaboratorFindManyArgs;
  invitationsSent?: boolean | InvitationFindManyArgs;
  invitationsAccepted?: boolean | InvitationFindManyArgs;
  // ... other relations
}
```

## Usage Examples

### Basic CRUD Operations

```typescript
import { PrismaClient, Prisma, UserType, ClientStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Create a user
const createUser = async (data: Prisma.UserCreateInput) => {
  return await prisma.user.create({
    data: {
      email: 'user@example.com',
      name: 'John Doe',
      userType: UserType.owner,
      createdByUserId: 'system-user-id'
    }
  });
};

// Find users with filters
const findUsers = async () => {
  return await prisma.user.findMany({
    where: {
      userType: UserType.collaborator,
      deletedAt: null
    },
    include: {
      collaborators: {
        include: {
          gym: true,
          role: true
        }
      }
    }
  });
};

// Update a gym client
const updateGymClient = async (
  id: string, 
  data: Prisma.GymClientUpdateInput
) => {
  return await prisma.gymClient.update({
    where: { id },
    data: {
      status: ClientStatus.inactive,
      updatedByUserId: 'current-user-id'
    }
  });
};
```

### Working with Relations

```typescript
// Create a gym with organization relation
const createGym = async () => {
  return await prisma.gym.create({
    data: {
      name: 'Fitness Center',
      slug: 'fitness-center',
      gymCode: 'FC001',
      organization: {
        connect: { id: 'org-id' }
      },
      createdBy: {
        connect: { id: 'user-id' }
      }
    },
    include: {
      organization: true,
      membershipPlans: true
    }
  });
};

// Create a contract with relations
const createContract = async () => {
  return await prisma.contract.create({
    data: {
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      basePrice: 100.00,
      finalAmount: 100.00,
      currency: 'USD',
      status: ContractStatus.active,
      paymentFrequency: PaymentFrequency.monthly,
      gymClient: {
        connect: { id: 'client-id' }
      },
      gymMembershipPlan: {
        connect: { id: 'plan-id' }
      },
      createdBy: {
        connect: { id: 'user-id' }
      }
    }
  });
};
```

### Complex Queries

```typescript
// Find active contracts with client and plan details
const findActiveContracts = async (gymId: string) => {
  return await prisma.contract.findMany({
    where: {
      status: ContractStatus.active,
      gymClient: {
        gymId,
        status: ClientStatus.active
      },
      deletedAt: null
    },
    include: {
      gymClient: true,
      gymMembershipPlan: true,
      contractAssets: {
        include: {
          asset: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
};

// Aggregate queries
const getClientStats = async (gymId: string) => {
  const stats = await prisma.gymClient.groupBy({
    by: ['status'],
    where: {
      gymId,
      deletedAt: null
    },
    _count: {
      id: true
    }
  });
  
  return stats;
};
```

### Transaction Examples

```typescript
// Create client with initial evaluation
const createClientWithEvaluation = async (
  clientData: Prisma.GymClientCreateInput,
  evaluationData: Omit<Prisma.EvaluationCreateInput, 'gymClient'>
) => {
  return await prisma.$transaction(async (tx) => {
    // Create client
    const client = await tx.gymClient.create({
      data: clientData
    });
    
    // Create initial evaluation
    const evaluation = await tx.evaluation.create({
      data: {
        ...evaluationData,
        gymClient: {
          connect: { id: client.id }
        }
      }
    });
    
    return { client, evaluation };
  });
};
```

### Working with JSON Fields

```typescript
// Update gym settings
const updateGymSettings = async (gymId: string) => {
  return await prisma.gym.update({
    where: { id: gymId },
    data: {
      settings: {
        notifications: {
          email: true,
          sms: false
        },
        features: {
          evaluations: true,
          checkIns: true
        }
      }
    }
  });
};

// Query JSON fields
const findGymsWithFeature = async (feature: string) => {
  return await prisma.gym.findMany({
    where: {
      amenities: {
        path: ['features'],
        array_contains: feature
      }
    }
  });
};
```

### Type-Safe Error Handling

```typescript
import { Prisma } from '@prisma/client';

const createUser = async (data: Prisma.UserCreateInput) => {
  try {
    return await prisma.user.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002: Unique constraint failed
      if (error.code === 'P2002') {
        throw new Error('Email already exists');
      }
      // P2025: Record not found
      if (error.code === 'P2025') {
        throw new Error('Related record not found');
      }
    }
    throw error;
  }
};
```

## Type Utilities

### Prisma Namespace Types

```typescript
// Get the type of a model's fields
type UserFields = Prisma.UserScalarFieldEnum;

// Get default selection type
type UserDefaultSelection = Prisma.UserGetPayload<{}>;

// Get type with specific includes
type UserWithOrganizations = Prisma.UserGetPayload<{
  include: { ownedOrganizations: true }
}>;

// Get type with specific select
type UserBasicInfo = Prisma.UserGetPayload<{
  select: { id: true; email: true; name: true }
}>;
```

### Working with Decimal Types

```typescript
import { Decimal } from '@prisma/client/runtime/library';

// Creating decimal values
const price = new Decimal(99.99);
const discount = new Decimal(10);

// Decimal operations
const finalPrice = price.minus(discount);
const percentage = discount.dividedBy(price).times(100);

// Converting to number
const priceAsNumber = price.toNumber();
const priceAsString = price.toString();
```

## Best Practices

1. **Always use lowercase enum values** in TypeScript code to match Prisma schema
2. **Import types from '@prisma/client'** for type safety
3. **Use Prisma namespace types** for advanced type operations
4. **Handle Prisma errors** with proper error codes
5. **Use transactions** for multi-step operations
6. **Leverage type inference** with Prisma's GetPayload utility
7. **Use proper decimal handling** for financial calculations
8. **Always include audit fields** (createdByUserId, updatedByUserId) in mutations

## Additional Resources

- [Prisma Client API Reference](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma TypeScript Types](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-types)
- [Error Reference](https://www.prisma.io/docs/reference/api-reference/error-reference)