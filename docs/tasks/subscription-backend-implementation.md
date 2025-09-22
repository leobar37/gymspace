# Subscription Management Backend Implementation

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
- Super admin endpoints currently function as public (temporary implementation)
- No authentication/permission guards required at this time
- This will be updated in the future when proper authentication is implemented

## Required Implementation

### Super Admin Subscription Plan Management

#### New Controller: `SubscriptionPlansController`
**Location**: `/packages/api/src/modules/subscription-plans/`

```typescript
@Controller('admin/subscription-plans')
@ApiTags('Admin - Subscription Plans')
export class SubscriptionPlansController {

  @Get()
  @ApiOperation({ summary: 'List all subscription plans' })
  async listPlans(@AppCtxt() ctx: IRequestContext): Promise<SubscriptionPlanDto[]>

  @Post()
  @ApiOperation({ summary: 'Create new subscription plan' })
  async createPlan(@Body() dto: CreateSubscriptionPlanDto, @AppCtxt() ctx: IRequestContext): Promise<SubscriptionPlanDto>

  @Get(':id')
  @ApiOperation({ summary: 'Get subscription plan details' })
  async getPlan(@Param('id') id: string, @AppCtxt() ctx: IRequestContext): Promise<SubscriptionPlanDto>

  @Put(':id')
  @ApiOperation({ summary: 'Update subscription plan' })
  async updatePlan(@Param('id') id: string, @Body() dto: UpdateSubscriptionPlanDto, @AppCtxt() ctx: IRequestContext): Promise<SubscriptionPlanDto>

  @Delete(':id')
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
  price: Record<string, { value: number; symbol: string }>;

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
  price: Record<string, { value: number; symbol: string }>;
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

#### Modify `getOrganization` for Super Admin
```typescript
@Get(':id')
@ApiOperation({ summary: 'Get organization details' })
@ApiResponse({ status: 200, description: 'Organization details' })
async getOrganization(@Param('id') id: string, @AppCtxt() ctx: RequestContext) {
  // For now, super admin endpoints are public, so include enhanced data
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
  @ApiOperation({ summary: 'Activate subscription renewal' })
  async activateRenewal(
    @Param('organizationId') organizationId: string,
    @Body() dto: ActivateRenewalDto,
    @AppCtxt() ctx: IRequestContext
  ): Promise<SubscriptionStatusDto>

  @Post('cancel')
  @ApiOperation({ summary: 'Cancel subscription with reason' })
  async cancelSubscription(
    @Param('organizationId') organizationId: string,
    @Body() dto: CancelSubscriptionDto,
    @AppCtxt() ctx: IRequestContext
  ): Promise<SubscriptionStatusDto>

  @Post('upgrade')
  @ApiOperation({ summary: 'Upgrade subscription plan' })
  async upgradeSubscription(
    @Param('organizationId') organizationId: string,
    @Body() dto: UpgradeSubscriptionDto,
    @AppCtxt() ctx: IRequestContext
  ): Promise<SubscriptionStatusDto>

  @Get('history')
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
1. **Public Access**: Super admin routes currently function as public endpoints
2. **No Guards Required**: No authentication/permission guards at this time
3. **Future Update**: Authentication will be added when system is ready
4. **Service Layer**: Services should be prepared for future permission checks

### Data Validation
1. **DTO Validation**: Use class-validator decorators
2. **Business Rules**: Implement business logic in service layer
3. **Database Constraints**: Respect existing unique constraints
4. **Type Safety**: Maintain TypeScript type safety throughout

### Caching Strategy
1. **Plan Caching**: Cache subscription plans (TTL: 1 hour)
2. **Status Caching**: Cache subscription status (TTL: 5 minutes)
3. **Invalidation**: Clear caches on plan/subscription changes
4. **Super Admin Context**: Consider cache keys for super admin data

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

### Caching Strategy
1. **Plan Data**: Cache subscription plans aggressively
2. **Organization Lists**: Cache paginated results for super admin views
3. **Usage Statistics**: Cache expensive usage calculations
4. **Cache Warming**: Pre-populate critical cache entries

## API Documentation

### Swagger Integration
1. **Complete Documentation**: Document all new endpoints
2. **Request/Response Examples**: Provide comprehensive examples
3. **Error Responses**: Document all possible error responses
4. **Authentication**: Clearly mark super admin only endpoints

### Postman Collection
1. **Admin Endpoints**: Create collection for super admin operations
2. **Test Scenarios**: Include test cases for various scenarios
3. **Environment Variables**: Set up for different environments

## Deployment Considerations

### Environment Configuration
1. **Feature Flags**: Consider feature flags for gradual rollout
2. **Super Admin Setup**: Document super admin user creation process
3. **Migration Strategy**: Plan for zero-downtime deployments

### Monitoring
1. **Admin Actions**: Log all super admin subscription actions
2. **Usage Metrics**: Track subscription plan usage
3. **Error Rates**: Monitor error rates for new endpoints
4. **Performance**: Monitor response times for admin operations

## Security Considerations

### Access Control
1. **Current State**: Super admin endpoints are currently public (temporary)
2. **Future Enhancement**: Proper authentication to be implemented later
3. **Audit Logging**: Log all admin actions for audit trail
4. **Rate Limiting**: Consider rate limiting for admin endpoints

### Data Protection
1. **Personal Data**: Handle PII in compliance with privacy regulations
2. **Financial Data**: Secure handling of subscription and payment data
3. **Organization Isolation**: Maintain data isolation between organizations
4. **Backup Strategy**: Ensure subscription data is included in backups

---

## Next Steps

1. **Create New Modules**: Set up subscription-plans and admin-subscription-management modules
2. **Implement DTOs**: Create all required DTOs with proper validation
3. **Service Implementation**: Implement business logic following patterns
4. **Controller Implementation**: Create controllers with proper documentation
5. **Testing**: Implement comprehensive test suite
6. **Documentation**: Update API documentation and create deployment guides