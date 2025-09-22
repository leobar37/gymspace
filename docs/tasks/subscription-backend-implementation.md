# Subscription Management Backend Implementation

## Schema Changes Required

### No Database Schema Changes Needed ✅

The current Prisma schema already has all necessary entities and fields for subscription management:
- **SubscriptionPlan** entity exists with all required fields
- **SubscriptionOrganization** entity exists with proper relationships
- **Enums** (SubscriptionStatus, DurationPeriod) are already defined
- **JSON fields** for flexible data (price, features, metadata)
- **Audit fields** and soft delete support already implemented

**Note**: The only modification needed is in the seed data (`seed.ts`) to include only Peru pricing.

## Entity Field Documentation

### SubscriptionPlan Entity

**Table Name**: `subscription_plans`

| Field | Type | Description | Required | Notes |
|-------|------|-------------|----------|-------|
| id | string (UUID) | Unique identifier | Yes | Auto-generated |
| name | string | Plan name (e.g., "Básico", "Premium") | Yes | |
| price | JSON | Multi-currency pricing object | Yes | `{ PEN: { currency: 'PEN', value: 110 } }` |
| billingFrequency | string | Billing cycle (e.g., "monthly", "annual") | Yes | |
| duration | number | Duration of subscription | No | Number of days/months |
| durationPeriod | enum | Period type: DAY or MONTH | No | |
| maxGyms | number | Maximum gyms allowed | Yes | |
| maxClientsPerGym | number | Maximum clients per gym | Yes | |
| maxUsersPerGym | number | Maximum users/collaborators per gym | Yes | |
| features | JSON | Feature flags and configuration | Yes | `{ prioritySupport: boolean, ... }` |
| description | string | Plan description | No | Marketing text |
| isActive | boolean | Plan availability status | Yes | Default: true |
| createdByUserId | string | User who created the plan | No | |
| updatedByUserId | string | User who last updated | No | |
| createdAt | DateTime | Creation timestamp | Yes | Auto-generated |
| updatedAt | DateTime | Last update timestamp | Yes | Auto-updated |
| deletedAt | DateTime | Soft delete timestamp | No | |

### SubscriptionOrganization Entity

**Table Name**: `subscription_organizations`

| Field | Type | Description | Required | Notes |
|-------|------|-------------|----------|-------|
| id | string (UUID) | Unique identifier | Yes | Auto-generated |
| organizationId | string | Organization reference | Yes | Foreign key |
| subscriptionPlanId | string | Plan reference | Yes | Foreign key |
| status | enum | Subscription status | Yes | active, inactive, expired, paused, pending_upgrade |
| startDate | DateTime | Subscription start date | Yes | |
| endDate | DateTime | Subscription end date | Yes | |
| isActive | boolean | Active subscription flag | Yes | Default: true |
| metadata | JSON | Additional data | No | Cancellation reason, upgrade history, etc. |
| createdByUserId | string | User who created | Yes | |
| updatedByUserId | string | User who last updated | No | |
| createdAt | DateTime | Creation timestamp | Yes | Auto-generated |
| updatedAt | DateTime | Last update timestamp | Yes | Auto-updated |
| deletedAt | DateTime | Soft delete timestamp | No | |

**Unique Constraint**: `[organizationId, isActive]` - Ensures only one active subscription per organization

### Enums

**SubscriptionStatus**:
- `active` - Subscription is currently active
- `inactive` - Subscription is inactive (manual deactivation)
- `expired` - Subscription period has ended
- `paused` - Subscription temporarily suspended
- `pending_upgrade` - In process of upgrading to new plan

**DurationPeriod**:
- `DAY` - Duration measured in days
- `MONTH` - Duration measured in months

## Current State Analysis

### Database Schema (Prisma)

#### Existing Entities
- **SubscriptionPlan**: Defines subscription plans with pricing, limits, and features
  - Contains `maxGyms`, `maxClientsPerGym`, `maxUsersPerGym` limits
  - JSON fields for `price` and `features`
  - Billing frequency and duration settings
  - Soft delete support with audit fields

- **SubscriptionOrganization**: Links organizations to subscription plans
  - Status enum: `active`, `inactive`, `expired`, `paused`, `pending_upgrade`
  - Start/end date tracking
  - Unique constraint on `[organizationId, isActive]` ensures one active subscription
  - Metadata JSON field for additional data
  - Full audit trail support

#### Key Relationships
- `Organization` → `SubscriptionOrganization[]` (one-to-many)
- `SubscriptionPlan` → `SubscriptionOrganization[]` (one-to-many)
- Both entities have proper audit trail with created/updated by user tracking

### Current Implementation

#### Organizations Module
**Controller**: `/packages/api/src/modules/organizations/organizations.controller.ts`
- `GET /organizations/list` - Super admin only, lists all organizations
- `GET /organizations/:id` - Get organization details with subscription data
- `PUT /organizations/:id` - Update organization
- `GET /organizations/:id/stats` - Organization statistics and usage

**Service**: `/packages/api/src/modules/organizations/organizations.service.ts`
- `listOrganizations()` - Returns organizations with owner and gyms data (missing subscription info)
- `getOrganization()` - Includes active subscription plan data
- `getOrganizationStats()` - Comprehensive usage statistics vs subscription limits
- Helper methods: `canAddGym()`, `canAddClient()`, `canAddCollaborator()`

#### Subscriptions Module
**Controller**: `/packages/api/src/modules/subscriptions/subscriptions.controller.ts`
- `GET /subscriptions/plans` - Get available plans (currently free only)
- `GET /subscriptions/organizations/:id/status` - Get subscription status
- `POST /subscriptions/organizations/:id/affiliate` - Affiliate to free plans only
- `GET /subscriptions/organizations/:id/limits/:type` - Check subscription limits

**Service**: `/packages/api/src/modules/subscriptions/subscriptions.service.ts`
- `getAvailablePlans()` - Returns all active plans
- `getSubscriptionStatus()` - Detailed subscription information with usage
- `affiliateOrganization()` - Limited to free plans only
- `upgradeSubscription()` - Exists but limited functionality
- `checkSubscriptionLimit()` - Validates against plan limits
- `createFreeTrialSubscription()` - Auto-creates trials for new orgs

#### Permission System
- `PERMISSIONS.SUPER_ADMIN` - Special permission for super admin operations
- All super admin endpoints must include `@Allow(PERMISSIONS.SUPER_ADMIN)` decorator
- Currently the guard treats these as public, but the decorator must be present
- Guard will be updated later to properly enforce the permission

## Required Implementation

### Super Admin Subscription Plan Management

#### New Controller: `SubscriptionPlansController`
**Location**: `/packages/api/src/modules/subscription-plans/`

```typescript
@Controller('admin/subscription-plans')
@ApiTags('Admin - Subscription Plans')
export class SubscriptionPlansController {

  @Get()
  @Allow(PERMISSIONS.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all subscription plans' })
  async listPlans(@AppCtxt() ctx: IRequestContext): Promise<SubscriptionPlanDto[]>

  @Post()
  @Allow(PERMISSIONS.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create new subscription plan' })
  async createPlan(@Body() dto: CreateSubscriptionPlanDto, @AppCtxt() ctx: IRequestContext): Promise<SubscriptionPlanDto>

  @Get(':id')
  @Allow(PERMISSIONS.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get subscription plan details' })
  async getPlan(@Param('id') id: string, @AppCtxt() ctx: IRequestContext): Promise<SubscriptionPlanDto>

  @Put(':id')
  @Allow(PERMISSIONS.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update subscription plan' })
  async updatePlan(@Param('id') id: string, @Body() dto: UpdateSubscriptionPlanDto, @AppCtxt() ctx: IRequestContext): Promise<SubscriptionPlanDto>

  @Delete(':id')
  @Allow(PERMISSIONS.SUPER_ADMIN)
  @ApiOperation({ summary: 'Soft delete subscription plan' })
  async deletePlan(@Param('id') id: string, @AppCtxt() ctx: IRequestContext): Promise<{ success: boolean }>
}
```

#### Required DTOs

**CreateSubscriptionPlanDto**
```typescript
export class CreateSubscriptionPlanDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  price: {
    PEN: { currency: string; value: number };
    // Future: USD, COP, MXN for other countries
  };

  @IsString()
  @IsNotEmpty()
  billingFrequency: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  @IsOptional()
  @IsEnum(['DAY', 'MONTH'])
  durationPeriod?: 'DAY' | 'MONTH';

  @IsInt()
  @Min(1)
  maxGyms: number;

  @IsInt()
  @Min(1)
  maxClientsPerGym: number;

  @IsInt()
  @Min(1)
  maxUsersPerGym: number;

  @IsObject()
  features: Record<string, any>;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
```

**UpdateSubscriptionPlanDto**
```typescript
export class UpdateSubscriptionPlanDto extends PartialType(CreateSubscriptionPlanDto) {}
```

**SubscriptionPlanDto**
```typescript
export class SubscriptionPlanDto {
  id: string;
  name: string;
  price: {
    PEN?: { currency: 'PEN'; value: number };
    USD?: { currency: 'USD'; value: number };
    COP?: { currency: 'COP'; value: number };
    MXN?: { currency: 'MXN'; value: number };
  };
  billingFrequency: string;
  duration?: number;
  durationPeriod?: string;
  maxGyms: number;
  maxClientsPerGym: number;
  maxUsersPerGym: number;
  features: Record<string, any>;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Statistics
  activeSubscriptions?: number;
  totalOrganizations?: number;
}
```

### Enhanced Organizations Controller

#### Create New `getOrganization` for Super Admin
```typescript
@Get('admin/organizations/:id')
@Allow(PERMISSIONS.SUPER_ADMIN)
@ApiOperation({ summary: 'Get organization details with subscription data for super admin' })
@ApiResponse({ status: 200, description: 'Organization details with full subscription information' })
async getOrganizationForAdmin(@Param('id') id: string, @AppCtxt() ctx: RequestContext) {
  return await this.organizationsService.getOrganization(ctx, id, { includeSuperAdminData: true });
}
```

#### Enhanced `listOrganizations` Response
Update the service to include subscription information:

```typescript
export class ListOrganizationsResponseDto {
  id: string;
  name: string;
  owner: {
    id: string;
    email: string;
    fullName: string;
  };
  gyms: Array<{
    id: string;
    name: string;
    address: string;
  }>;
  subscription?: {
    planName: string;
    status: SubscriptionStatus;
    startDate: Date;
    endDate: Date;
    isExpired: boolean;
  };
  createdAt: Date;
}
```

### Super Admin Subscription Management

#### New Controller: `AdminSubscriptionManagementController`
**Location**: `/packages/api/src/modules/admin-subscription-management/`

```typescript
@Controller('admin/organizations/:organizationId/subscriptions')
@ApiTags('Admin - Subscription Management')
export class AdminSubscriptionManagementController {

  @Post('activate-renewal')
  @Allow(PERMISSIONS.SUPER_ADMIN)
  @ApiOperation({ summary: 'Activate subscription renewal' })
  async activateRenewal(
    @Param('organizationId') organizationId: string,
    @Body() dto: ActivateRenewalDto,
    @AppCtxt() ctx: IRequestContext
  ): Promise<SubscriptionStatusDto>

  @Post('cancel')
  @Allow(PERMISSIONS.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cancel subscription with reason' })
  async cancelSubscription(
    @Param('organizationId') organizationId: string,
    @Body() dto: CancelSubscriptionDto,
    @AppCtxt() ctx: IRequestContext
  ): Promise<SubscriptionStatusDto>

  @Post('upgrade')
  @Allow(PERMISSIONS.SUPER_ADMIN)
  @ApiOperation({ summary: 'Upgrade subscription plan' })
  async upgradeSubscription(
    @Param('organizationId') organizationId: string,
    @Body() dto: UpgradeSubscriptionDto,
    @AppCtxt() ctx: IRequestContext
  ): Promise<SubscriptionStatusDto>

  @Get('history')
  @Allow(PERMISSIONS.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get subscription history' })
  async getSubscriptionHistory(
    @Param('organizationId') organizationId: string,
    @AppCtxt() ctx: IRequestContext
  ): Promise<SubscriptionHistoryDto[]>
}
```

#### Required DTOs for Subscription Management

**ActivateRenewalDto**
```typescript
export class ActivateRenewalDto {
  @IsOptional()
  @IsString()
  subscriptionPlanId?: string; // If changing plan during renewal

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMonths?: number; // Custom duration

  @IsOptional()
  @IsString()
  notes?: string;
}
```

**CancelSubscriptionDto**
```typescript
export class CancelSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsOptional()
  @IsBoolean()
  immediateTermination?: boolean; // Default: false (cancel at end of current period)

  @IsOptional()
  @IsString()
  notes?: string;
}
```

**UpgradeSubscriptionDto**
```typescript
export class UpgradeSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  newSubscriptionPlanId: string;

  @IsOptional()
  @IsBoolean()
  immediateUpgrade?: boolean; // Default: true

  @IsOptional()
  @IsString()
  notes?: string;
}
```

**SubscriptionHistoryDto**
```typescript
export class SubscriptionHistoryDto {
  id: string;
  planName: string;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
}
```

## Business Logic Requirements

### Subscription Plan Management
1. **CRUD Operations**: Full management of subscription plans by super admins
2. **Validation**: Ensure plan limits are reasonable and pricing is valid
3. **Active Plan Tracking**: Monitor how many organizations use each plan
4. **Safe Deletion**: Prevent deletion of plans with active subscriptions

### Subscription Renewal System
1. **Automatic Detection**: Identify subscriptions nearing expiration
2. **Renewal Activation**: Allow super admin to manually activate renewals
3. **Plan Changes**: Support plan changes during renewal process
4. **Duration Flexibility**: Allow custom renewal periods

### Subscription Cancellation
1. **Reason Tracking**: Mandatory cancellation reason for analytics
2. **Timing Options**:
   - Immediate termination
   - End of current billing period (default)
3. **Status Management**: Update subscription status appropriately
4. **Data Preservation**: Maintain subscription history

### Subscription Upgrades
1. **Plan Validation**: Ensure target plan exists and is active
2. **No Proration**: Cancel current subscription, start new one immediately
3. **Limit Validation**: Verify organization usage fits new plan limits
4. **Audit Trail**: Track all upgrade actions

### Enhanced Organization Data for Super Admins
1. **Subscription Details**: Include current plan, status, and dates
2. **Usage Metrics**: Show resource usage vs limits
3. **Historical Data**: Access to subscription change history
4. **Risk Indicators**: Flag overdue renewals or limit violations

## Implementation Guidelines

### Service Layer Architecture
1. **Follow RequestContext Pattern**: All methods must accept `IRequestContext` as first parameter
2. **Exception-First Approach**: Throw domain-specific exceptions, never return error objects
3. **Transaction Support**: Use Prisma transactions for multi-step operations
4. **Audit Trail**: Always set `createdByUserId` and `updatedByUserId`
5. **Soft Delete**: Respect existing soft delete patterns

### Permission System Integration
1. **Decorator Required**: All super admin routes must use `@Allow(PERMISSIONS.SUPER_ADMIN)`
2. **Guard Behavior**: Currently the guard treats these as public (will be updated)
3. **Consistent Pattern**: Maintain decorator consistency across all admin endpoints
4. **Service Layer**: Services should validate super admin context when appropriate

### Data Validation
1. **DTO Validation**: Use class-validator decorators
2. **Business Rules**: Implement business logic in service layer
3. **Database Constraints**: Respect existing unique constraints
4. **Type Safety**: Maintain TypeScript type safety throughout


### Error Handling
1. **Domain Exceptions**: Use existing exception classes
   - `ResourceNotFoundException` - Entity not found
   - `BusinessException` - Business rule violations
   - `ValidationException` - Input validation errors
   - `AuthorizationException` - Permission denied
2. **Meaningful Messages**: Provide clear error messages for API consumers
3. **Logging**: Log important actions and errors


## Database Migration Requirements

### Potential Schema Changes
1. **Metadata Enhancement**: Consider additional fields in `SubscriptionOrganization.metadata`
2. **Cancellation Tracking**: Add cancellation reason fields if needed in metadata
3. **Plan Statistics**: Consider denormalized statistics for performance

### Seed Data Updates
1. **Default Plans**: Ensure proper subscription plans exist
2. **Super Admin User**: Create or update super admin user for testing
3. **Test Organizations**: Create test data with various subscription states

## Performance Considerations

### Query Optimization
1. **Include Statements**: Optimize Prisma includes for subscription data
2. **Pagination**: Implement pagination for admin list views
3. **Indexing**: Ensure proper database indexes exist
4. **Aggregation**: Use efficient queries for statistics


## API Documentation

### Swagger Integration
1. **Complete Documentation**: Document all new endpoints
2. **Request/Response Examples**: Provide comprehensive examples
3. **Error Responses**: Document all possible error responses
4. **Authentication**: Clearly mark super admin only endpoints

## Price Management Strategy

### Multi-Country Pricing Structure

The subscription plan prices are stored as a JSON object in the database with support for multiple currencies. Based on the seed data analysis:

#### Current Price Structure
```typescript
price: {
  PEN: { currency: 'PEN', value: 110 },   // Peru - Soles
  USD: { currency: 'USD', value: 29.99 }, // USA/Ecuador - Dólares
  COP: { currency: 'COP', value: 129900 }, // Colombia - Pesos
  MXN: { currency: 'MXN', value: 549 }    // México - Pesos
}
```

#### Frontend Implementation (Admin Panel)

**Tab-Based Price Management**:
1. **Initial Implementation**: Only Peru (PEN) tab will be active
2. **Future Expansion**: Additional tabs for USD, COP, MXN (disabled initially)
3. **UI Structure**:
   ```
   [🇵🇪 Peru] | [🇺🇸 USA] | [🇨🇴 Colombia] | [🇲🇽 México]

   Peru Tab (Active):
   - Currency: PEN (Soles)
   - Price Input: S/. [___]
   - Automatic symbol display based on country
   ```

#### Backend Considerations

**Price Validation**:
- When creating/updating plans, initially only require PEN pricing
- Other currencies optional but structure supports them
- Validation ensures positive values and proper format

**Price Display Logic**:
- Organization's country determines which price to show
- Fallback to default currency if specific country price not set
- Price formatting based on locale (e.g., S/. 110 for Peru)

#### Database Schema Compatibility

**Current Schema** (`packages/api/prisma/schema.prisma`):
- SubscriptionPlan.price field is already JSON type
- No schema changes required
- Supports flexible pricing structure

**Seed Data**:
- Current seed includes 4 plans with multi-currency pricing
- Plans: Gratuito (Free), Básico, Premium, Enterprise
- All currencies pre-calculated based on exchange rates

#### API Response Format

When fetching plans for super admin:
```json
{
  "id": "plan-id",
  "name": "Básico",
  "price": {
    "PEN": { "currency": "PEN", "value": 110 }
    // Other currencies hidden initially
  },
  "billingFrequency": "monthly",
  // ... other fields
}
```

When creating/updating plans (initial phase):
```json
{
  "name": "New Plan",
  "price": {
    "PEN": { "currency": "PEN", "value": 150 }
  },
  // ... other required fields
}
```

### Implementation Notes

1. **No Schema Changes Needed**: Current JSON price field supports multi-currency
2. **Frontend Simplification**: Show only Peru tab initially, prepare structure for expansion
3. **Validation**: Backend accepts single currency (PEN) initially but maintains structure for future
4. **Display Logic**: Currency selection based on organization's country configuration
5. **Exchange Rate Management**: Future feature - for now, manual price setting per country

### Required Seed Data Modification

**File to modify**: `packages/api/prisma/seed.ts`

Update the seed data to only include Peru (PEN) pricing:

```typescript
const plans = [
  {
    name: 'Gratuito',
    price: {
      PEN: { currency: 'PEN', value: 0 }, // Peru - Soles Peruanos
    },
    billingFrequency: 'monthly',
    duration: 30,
    durationPeriod: 'DAY',
    maxGyms: 1,
    maxClientsPerGym: 10,
    maxUsersPerGym: 1,
    features: {
      prioritySupport: false,
    },
    description: 'Plan gratuito para comenzar - 30 días de prueba',
  },
  {
    name: 'Básico',
    price: {
      PEN: { currency: 'PEN', value: 110 }, // Peru - ~110 PEN
    },
    billingFrequency: 'monthly',
    maxGyms: 1,
    maxClientsPerGym: 100,
    maxUsersPerGym: 3,
    features: {
      prioritySupport: false,
    },
    description: 'Plan ideal para gimnasios pequeños',
  },
  {
    name: 'Premium',
    price: {
      PEN: { currency: 'PEN', value: 295 }, // Peru - ~295 PEN
    },
    billingFrequency: 'monthly',
    maxGyms: 3,
    maxClientsPerGym: 500,
    maxUsersPerGym: 10,
    features: {
      prioritySupport: true,
    },
    description: 'Para gimnasios en crecimiento con múltiples ubicaciones',
  },
  {
    name: 'Enterprise',
    price: {
      PEN: { currency: 'PEN', value: 739 }, // Peru - ~739 PEN
    },
    billingFrequency: 'monthly',
    maxGyms: 999, // Unlimited
    maxClientsPerGym: 9999, // Unlimited
    maxUsersPerGym: 999, // Unlimited
    features: {
      prioritySupport: true,
    },
    description: 'Solución completa para cadenas de gimnasios',
  },
];
```

**Note**: Remove USD, COP, and MXN entries from all plan prices in the seed file. This simplifies initial deployment while maintaining the structure for future expansion.

---

## Next Steps

1. **Create New Modules**: Set up subscription-plans and admin-subscription-management modules
2. **Implement DTOs**: Create all required DTOs with proper validation
3. **Service Implementation**: Implement business logic following patterns
4. **Controller Implementation**: Create controllers with proper documentation
5. **Testing**: Implement comprehensive test suite
6. **Documentation**: Update API documentation and create deployment guides

---

## Capabilities Summary - What Super Admin Can Do

With this implementation, the super admin will be able to:

### Subscription Plan Management
1. **List all subscription plans** - View all available plans with usage statistics
2. **Create new subscription plans** - Define pricing, limits, features, and billing frequency
3. **Get plan details** - View specific plan information including active subscriptions count
4. **Update existing plans** - Modify plan parameters (price, limits, features)
5. **Delete plans** - Soft delete plans that have no active subscriptions

### Organization Subscription Management
6. **View enhanced organization data** - Get organization details with full subscription information, usage metrics, and limits
7. **List all organizations** - View all organizations with their subscription status and plan information
8. **Activate subscription renewal** - Manually renew subscriptions with optional plan change and custom duration
9. **Cancel subscriptions** - Cancel with mandatory reason tracking, either immediately or at period end
10. **Upgrade subscription plans** - Change organization from one plan to another (e.g., free to premium) without proration
11. **View subscription history** - Access complete history of all subscription changes for an organization

### Monitoring and Analytics
12. **Track plan usage** - See how many organizations use each plan
13. **Monitor subscription status** - View active, expired, pending upgrade subscriptions
14. **Analyze cancellation reasons** - Understand why subscriptions are cancelled
15. **Verify limit compliance** - Ensure organizations stay within their plan limits

### Business Operations
16. **Manage billing cycles** - Control subscription start/end dates and renewal periods
17. **Handle plan transitions** - Smoothly migrate organizations between plans
18. **Enforce business rules** - Validate usage against plan limits before operations
19. **Maintain audit trail** - Track all subscription-related actions with user attribution
20. **Support multiple pricing models** - Configure different prices per country/currency