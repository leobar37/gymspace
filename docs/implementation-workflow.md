# GymSpace Use Cases Implementation Workflow

## Overview
This document provides a systematic implementation workflow for all use cases in the GymSpace system, following the backend architecture principles and entity relationships defined in the documentation.

## Architecture Principles to Follow
- **Exception-First**: Services throw exceptions, never return errors
- **Context-Aware**: All operations use RequestContext for gym/user/permission scoping
- **Permission-Based**: Use @Allow() decorator for access control
- **Soft Delete**: All entities use soft delete with audit fields
- **Multi-tenant**: Data isolation by gym through X-Gym-Id header

---

## Phase 1: Authentication & User Management (Week 1-2)
**Use Cases**: CU-001, CU-002, CU-003

### 1.1 Owner Registration (CU-001)
**Module**: `packages/api/src/modules/auth`

#### Implementation Tasks:
```typescript
// 1. Create DTOs
CreateOwnerDto {
  name: string
  email: string
  phone: string
  password: string
  organizationName: string
  subscriptionPlanId: UUID
}

// 2. AuthController endpoints
@Post('register/owner')
@Public()
async registerOwner(@Body() dto: CreateOwnerDto)

// 3. AuthService methods
- validateEmail(email: string)
- createSupabaseUser(dto)
- createLocalUser(supabaseUser)
- createOrganization(user, dto)
- sendVerificationEmail(user)
```

#### Dependencies:
- Supabase Auth setup
- Email service configuration
- Subscription plans seeded in database

#### Acceptance Criteria:
- [ ] Owner can register with organization details
- [ ] Email verification sent via Supabase
- [ ] Organization created with selected plan
- [ ] User type set as 'owner'
- [ ] Audit fields populated correctly

### 1.2 Collaborator Invitation (CU-002)
**Module**: `packages/api/src/modules/invitations`

#### Implementation Tasks:
```typescript
// 1. Create InvitationsModule
- InvitationsController
- InvitationsService
- DTOs: CreateInvitationDto, AcceptInvitationDto

// 2. Endpoints
@Post('invitations')
@Allow(PERMISSIONS.COLLABORATORS_CREATE)
async createInvitation(@Body() dto, @RequestContext() ctx)

@Post('invitations/:token/accept')
@Public()
async acceptInvitation(@Param('token') token, @Body() dto)

// 3. Service methods
- generateInvitationToken()
- createInvitation(gym, email, role)
- sendInvitationEmail()
- validateToken(token)
- createCollaboratorFromInvitation()
```

#### Scheduled Task:
```typescript
// Mark expired invitations
@Cron('0 0 * * *') // Daily at midnight
async markExpiredInvitations()
```

### 1.3 User Login (CU-003)
**Module**: `packages/api/src/modules/auth`

#### Implementation Tasks:
```typescript
// 1. Login endpoints
@Post('login')
@Public()
async login(@Body() dto: LoginDto)

// 2. Service enhancements
- validateCredentials(email, password)
- getSupabaseSession()
- getUserWithRoles(userId)
- determineRedirectPath(userType)
```

---

## Phase 2: Organization & Gym Management (Week 2-3)
**Use Cases**: CU-004, CU-005, CU-021

### 2.1 Organization Configuration (CU-021)
**Module**: `packages/api/src/modules/organizations`

#### Implementation Tasks:
```typescript
// 1. Create OrganizationsModule
- OrganizationsController
- OrganizationsService

// 2. Endpoints
@Put('organizations/:id')
@Allow(PERMISSIONS.ORGANIZATIONS_UPDATE)
async updateOrganization(@Param('id') id, @Body() dto)

// 3. DTO
UpdateOrganizationDto {
  country?: string
  currency?: string (ISO 4217)
  timezone?: string
  settings?: Record<string, any>
}
```

### 2.2 Gym Management (CU-004, CU-005)
**Module**: `packages/api/src/modules/gyms`

#### Implementation Tasks:
```typescript
// 1. Create GymsModule
- GymsController
- GymsService

// 2. Endpoints
@Post('gyms')
@Allow(PERMISSIONS.GYMS_CREATE)
async createGym(@Body() dto, @RequestContext() ctx)

@Put('gyms/:id')
@Allow(PERMISSIONS.GYMS_UPDATE)
async updateGym(@Param('id') id, @Body() dto)

// 3. Service methods
- validateGymLimit(organizationId)
- generateGymCode()
- createGym(dto, organizationId)
```

#### Business Rules:
- Check subscription plan gym limit
- Generate unique 6-character gym code
- Inherit organization currency/timezone

---

## Phase 3: Client Management (Week 3-4)
**Use Cases**: CU-006, CU-007, CU-008

### 3.1 Clients Module
**Module**: `packages/api/src/modules/clients`

#### Implementation Tasks:
```typescript
// 1. Create ClientsModule
- ClientsController
- ClientsService
- DTOs: CreateClientDto, UpdateClientDto, QueryClientsDto

// 2. Endpoints
@Post('clients')
@Allow(PERMISSIONS.CLIENTS_CREATE)
async createClient(@Body() dto, @RequestContext() ctx)

@Get('clients')
@Allow(PERMISSIONS.CLIENTS_READ)
async getClients(@Query() query: QueryClientsDto, @RequestContext() ctx)

@Put('clients/:id')
@Allow(PERMISSIONS.CLIENTS_UPDATE)
async updateClient(@Param('id') id, @Body() dto)

// 3. Service methods
- generateClientNumber(gymId)
- validateClientLimit(gymId)
- searchClients(filters, gymId)
```

#### Features:
- Auto-generate sequential client numbers per gym
- Document ID unique validation per gym
- Pagination with standard format
- Advanced search filters

---

## Phase 4: Membership Plans & Contracts (Week 4-5)
**Use Cases**: CU-009, CU-010, CU-011, CU-012, CU-013

### 4.1 Membership Plans Module
**Module**: `packages/api/src/modules/plans`

#### Implementation Tasks:
```typescript
// 1. Create PlansModule
- PlansController
- PlansService

// 2. Plan configuration
GymMembershipPlanDto {
  name: string
  basePrice: number
  durationMonths: number
  features: string[]
  termsAndConditions: string
  allowsCustomPricing: boolean
  maxEvaluations: number
  includesAdvisor: boolean
}
```

### 4.2 Contracts Module
**Module**: `packages/api/src/modules/contracts`

#### Implementation Tasks:
```typescript
// 1. Create ContractsModule with complex workflow
- ContractsController
- ContractsService
- ContractAssetsService

// 2. Contract lifecycle endpoints
@Post('contracts')
@Allow(PERMISSIONS.CONTRACTS_CREATE)
async createContract(@Body() dto, @RequestContext() ctx)

@Post('contracts/:id/documents')
@Allow(PERMISSIONS.CONTRACTS_UPDATE)
async uploadDocument(@Param('id') id, @UploadedFile() file)

@Post('contracts/:id/activate')
@Allow(PERMISSIONS.CONTRACTS_APPROVE)
async activateContract(@Param('id') id)

// 3. Pricing logic
- calculateFinalAmount(basePrice, customPrice, discounts)
- validateCustomPricing(plan, customPrice)
```

#### Scheduled Tasks:
```typescript
@Cron('0 2 * * *') // Daily at 2 AM
async updateContractStatuses() {
  // Mark expiring_soon (30, 15, 7, 1 days)
  // Mark expired contracts
  // Block check-ins for expired
}
```

---

## Phase 5: Check-ins & Access Control (Week 5)
**Use Cases**: CU-014, CU-015

### 5.1 Check-ins Module
**Module**: `packages/api/src/modules/check-ins`

#### Implementation Tasks:
```typescript
// 1. Create CheckInsModule
- CheckInsController
- CheckInsService

// 2. Endpoints
@Post('check-ins')
@Allow(PERMISSIONS.CHECKINS_CREATE)
async createCheckIn(@Body() dto, @RequestContext() ctx)

@Get('check-ins/history')
@Allow(PERMISSIONS.CHECKINS_READ)
async getCheckInHistory(@Query() query, @RequestContext() ctx)

// 3. Validation
- validateActiveContract(clientId)
- preventDuplicateCheckIn(clientId, timeWindow)
```

---

## Phase 6: Notifications & Reporting (Week 6)
**Use Cases**: CU-016, CU-017, CU-018, CU-019, CU-020

### 6.1 Notifications Module
**Module**: `packages/api/src/modules/notifications`

#### Implementation Tasks:
```typescript
// 1. Notification service
- Email notifications via SendGrid/SES
- In-app notifications storage
- Push notifications (future)

// 2. Scheduled notifications
@Cron('0 9 * * *') // Daily at 9 AM
async sendExpirationAlerts() {
  // Contract expiration alerts
  // Evaluation deadline reminders
}
```

### 6.2 Reports Module
**Module**: `packages/api/src/modules/reports`

#### Implementation Tasks:
```typescript
// 1. Dashboard endpoints
@Get('reports/dashboard')
@Allow(PERMISSIONS.REPORTS_VIEW)
async getDashboard(@RequestContext() ctx)

@Get('reports/financial')
@Allow(PERMISSIONS.REPORTS_FINANCIAL)
async getFinancialReport(@Query() filters)

// 2. Report generation
- Real-time metrics calculation
- Cached aggregations for performance
- Export to PDF/Excel
```

---

## Phase 7: Asset Management (Week 7)
**Use Cases**: CU-022, CU-023

### 7.1 Assets Module (Already Core)
**Module**: `packages/api/src/modules/assets`

#### Implementation Tasks:
```typescript
// 1. Complete AssetsModule
- AssetsController
- AssetsService
- S3Service/MinioService

// 2. Endpoints
@Post('assets/upload')
@UseInterceptors(FastifyFileInterceptor())
async uploadAsset(@UploadedFile() file, @Body() metadata)

@Get('assets/:id/download')
async downloadAsset(@Param('id') id)

// 3. Features
- File type validation
- Virus scanning (ClamAV)
- Image optimization
- Signed URLs for secure access
```

---

## Phase 8: Evaluations System (Week 8-9)
**Use Cases**: CU-027, CU-028, CU-029, CU-030, CU-031

### 8.1 Evaluations Module
**Module**: `packages/api/src/modules/evaluations`

#### Complex Implementation:
```typescript
// 1. Create EvaluationsModule
- EvaluationsController
- EvaluationsService
- EvaluationCommentsService
- EvaluationAssetsService

// 2. Dynamic form structure
@Put('gyms/:gymId/evaluation-structure')
@Allow(PERMISSIONS.GYMS_UPDATE)
async updateEvaluationStructure(@Param('gymId') gymId, @Body() structure)

// 3. Evaluation lifecycle
@Post('evaluations')
@Allow(PERMISSIONS.EVALUATIONS_CREATE)
async createEvaluation(@Body() dto, @RequestContext() ctx)

@Post('evaluations/:id/comments')
@Allow(PERMISSIONS.EVALUATIONS_UPDATE)
async addComment(@Param('id') id, @Body() comment)

@Put('evaluations/:id/complete')
@Allow(PERMISSIONS.EVALUATIONS_UPDATE)
async completeEvaluation(@Param('id') id, @Body() finalData)

// 4. Progress calculation
- compareInitialVsFinalData()
- generateProgressReport()
```

#### Scheduled Tasks:
```typescript
@Cron('0 8 * * *') // Daily at 8 AM
async sendEvaluationReminders() {
  // 7, 3, 1 day reminders
  // Mark overdue evaluations
}
```

---

## Phase 9: Public Catalog (Week 9)
**Use Cases**: CU-032, CU-033

### 9.1 Public Catalog Module
**Module**: `packages/api/src/modules/catalog`

#### Implementation Tasks:
```typescript
// 1. Public endpoints (no auth)
@Get('catalog/gyms/:gymCode')
@Public()
async getGymCatalog(@Param('gymCode') gymCode)

@Get('catalog/gyms/:gymCode/plans')
@Public()
async getPublicPlans(@Param('gymCode') gymCode)

// 2. Collaborator profiles
@Put('collaborators/:id/profile')
@Allow(PERMISSIONS.COLLABORATORS_UPDATE)
async updateProfile(@Param('id') id, @Body() profile)
```

---

## Testing Strategy

### Unit Tests
```typescript
// Example: ContractsService
describe('ContractsService', () => {
  it('should calculate final amount with discounts', () => {
    const result = service.calculateFinalAmount(100, null, 10, 5);
    expect(result).toBe(85); // 100 - 10% - 5
  });
  
  it('should throw when custom price not allowed', () => {
    expect(() => service.validateCustomPricing(plan, 50))
      .toThrow(BusinessException);
  });
});
```

### Integration Tests
```typescript
// Example: Contracts flow
it('should complete contract lifecycle', async () => {
  // 1. Create contract
  const contract = await request(app)
    .post('/contracts')
    .set('Authorization', `Bearer ${token}`)
    .set('X-Gym-Id', gymId)
    .send(createContractDto);
    
  // 2. Upload documents
  await request(app)
    .post(`/contracts/${contract.id}/documents`)
    .attach('file', 'test-receipt.pdf');
    
  // 3. Activate
  await request(app)
    .post(`/contracts/${contract.id}/activate`);
});
```

---

## Deployment Checklist

### Pre-deployment
- [ ] All migrations tested
- [ ] Seed data prepared (roles, permissions, plans)
- [ ] Environment variables configured
- [ ] Supabase project setup
- [ ] S3/MinIO buckets created

### Post-deployment
- [ ] Health checks passing
- [ ] Swagger documentation accessible
- [ ] Scheduled tasks running
- [ ] Monitoring configured
- [ ] Backup strategy implemented

---

## Performance Considerations

### Caching Strategy
```typescript
// Cache keys by context
`gym:${gymId}:clients` - 30 min TTL
`gym:${gymId}:contracts:active` - 15 min TTL
`user:${userId}:permissions` - 15 min TTL
`reports:${gymId}:dashboard` - 5 min TTL
```

### Database Indexes
```sql
-- Critical indexes
CREATE INDEX idx_gym_clients_gym_id ON gym_clients(gym_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contracts_status ON contracts(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_check_ins_timestamp ON check_ins(gym_id, timestamp);
```

### Query Optimization
- Use pagination for all list endpoints
- Implement cursor-based pagination for large datasets
- Use database views for complex reports
- Batch operations where possible

---

## Risk Mitigation

### Technical Risks
- **Database Performance**: Implement read replicas for reports
- **File Storage**: Use CDN for asset delivery
- **Rate Limiting**: Implement per-endpoint limits
- **Memory Leaks**: Monitor with APM tools

### Business Risks
- **Data Loss**: Daily backups with point-in-time recovery
- **Multi-tenancy Breach**: Extensive testing of context isolation
- **Subscription Limits**: Real-time enforcement with graceful degradation
- **Compliance**: Audit logs for all sensitive operations