# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GymSpace API is a multi-tenant gym management system backend built with NestJS, PostgreSQL, Prisma ORM, and Redis caching. The system implements clean architecture with exception-first approach, context-aware permissions, and comprehensive business domain coverage.

## Development Commands

### Environment Setup
```bash
# From root directory - install all dependencies
pnpm install

# Start Docker services (PostgreSQL, Redis, MinIO)
pnpm run dev:docker

# Setup environment for API
cd packages/api
cp .env.example .env
# Edit .env with your Supabase credentials and other configs
```

### Running the API
```bash
# From packages/api directory
pnpm run dev              # Start in development mode with hot reload
pnpm run start:debug      # Start with debugging enabled
pnpm run start:prod       # Start in production mode
pnpm run build           # Build the application
```

### Database Management
```bash
# All commands from packages/api directory
pnpm run prisma:generate      # Generate Prisma client
pnpm run prisma:migrate       # Create and run migrations
pnpm run prisma:migrate:deploy # Deploy migrations to production
pnpm run prisma:studio        # Open Prisma Studio GUI
pnpm run prisma:seed          # Seed database with initial data
pnpm run prisma:reset         # Reset database (WARNING: deletes all data)
```

### Testing
```bash
# From packages/api directory
pnpm run test              # Run unit tests
pnpm run test:watch        # Run tests in watch mode
pnpm run test:cov          # Run tests with coverage report
pnpm run test:debug        # Debug tests
pnpm run test:e2e          # Run end-to-end tests
```

### Code Quality
```bash
# From packages/api directory
pnpm run lint              # Run ESLint
pnpm run format            # Format code with Prettier
```

## Architecture Overview

### Core Architectural Principles

1. **Exception-First Pattern**: Services throw domain-specific exceptions, never return error objects
   - BusinessException
   - ValidationException
   - ResourceNotFoundException
   - AuthorizationException

2. **RequestContext Pattern**: Every request has a context containing:
   - User information from Supabase Auth
   - Current gym context (from X-Gym-Id header)
   - Computed permissions based on user role
   - Scoped cache instance

3. **Permission System**: Declarative permission model
   - @Allow() decorator on controller methods
   - PermissionGuard validates against user's role permissions
   - Fine-grained permissions like CLIENTS_CREATE, CONTRACTS_APPROVE

4. **Multi-Tenancy**: Complete data isolation
   - All queries automatically filtered by gymId
   - RequestContext ensures gym-scoped operations
   - Cross-gym data access prevented at service level

5. **Audit Trail**: Every entity includes:
   - created_by_user_id
   - updated_by_user_id
   - created_at
   - updated_at
   - deleted_at (soft delete)

## Implemented Modules and Services

### Core Infrastructure Modules

1. **DatabaseModule** (`src/core/database/`)
   - PrismaService with automatic gym filtering
   - Soft delete middleware
   - Transaction support
   - Connection pooling

2. **AuthModule** (`src/core/auth/`)
   - Supabase Auth integration
   - JWT validation
   - AuthGuard for route protection
   - User context extraction

3. **CacheModule** (`src/core/cache/`)
   - Redis integration with cache-manager
   - Context-aware caching
   - TTL strategies per data type
   - Cache invalidation patterns

4. **CommonModule** (`src/common/`)
   - GlobalExceptionFilter
   - RequestContextInterceptor
   - PaginationService
   - Shared DTOs and decorators

### Business Domain Modules

1. **AuthModule** (`src/modules/auth/`)
   - User registration (owner/collaborator flows)
   - Email verification
   - Login/logout
   - Password reset
   - Collaborator invitation acceptance

2. **OnboardingModule** (`src/modules/onboarding/`)
   - Guided setup wizard
   - Organization configuration
   - Initial gym setup
   - Feature configuration
   - Onboarding status tracking

3. **OrganizationsModule** (`src/modules/organizations/`)
   - Organization management
   - Subscription handling
   - Organization settings
   - Multi-gym support

4. **GymsModule** (`src/modules/gyms/`)
   - Gym CRUD operations
   - Gym settings management
   - Operating hours configuration
   - Feature toggles

5. **InvitationsModule** (`src/modules/invitations/`)
   - Collaborator invitations
   - Email-based invitation flow
   - Invitation acceptance/rejection
   - Expiration handling

6. **ClientsModule** (`src/modules/clients/`)
   - Client registration and management
   - Client search and filtering
   - Document attachment
   - Activity tracking
   - Client status management

7. **MembershipPlansModule** (`src/modules/membership-plans/`)
   - Plan creation and pricing
   - Multiple currency support
   - Plan status management
   - Feature configuration per plan

8. **ContractsModule** (`src/modules/contracts/`)
   - Contract creation and renewal
   - Payment tracking
   - Freeze/unfreeze functionality
   - Expiration monitoring
   - Contract history

9. **EvaluationsModule** (`src/modules/evaluations/`)
   - Physical evaluations
   - Measurements tracking
   - Progress monitoring
   - Evaluation types (initial/progress/final)
   - File attachments

10. **CheckInsModule** (`src/modules/check-ins/`)
    - Gym entry/exit tracking
    - Check-in validation
    - History and analytics
    - Integration with contracts

11. **LeadsModule** (`src/modules/leads/`)
    - Lead capture and management
    - Lead status tracking
    - Conversion to clients
    - Source tracking

12. **AssetsModule** (`src/modules/assets/`)
    - Centralized file management
    - S3/MinIO integration
    - File upload/download
    - Asset categorization
    - Secure URL generation

13. **PublicCatalogModule** (`src/modules/public-catalog/`)
    - Public gym information
    - Available membership plans
    - Gym amenities and features
    - No authentication required

14. **HealthModule** (`src/modules/health/`)
    - Application health checks
    - Database connectivity
    - Redis status
    - S3 availability

### Service Layer Patterns

Each module typically includes:
- **Controller**: HTTP endpoints with @Allow() decorators
- **Service**: Business logic implementation (throws exceptions)
- **DTOs**: Request/response validation with class-validator
- **Module**: Dependency injection configuration

## Key Implementation Details

### RequestContext Usage
```typescript
// Controller method
@Get()
@Allow(['CLIENTS_READ'])
async findAll(
  @Query() query: SearchClientsDto,
  @RequestContext() context: IRequestContext
) {
  return this.clientsService.findAll(query, context);
}

// Service method
async findAll(query: SearchClientsDto, context: IRequestContext) {
  const gymId = context.getGymId();
  // Query automatically filtered by gymId
}
```

### Exception Handling
```typescript
// Service throws domain exception
throw new ResourceNotFoundException('Client not found');

// Global filter transforms to HTTP response
{
  "statusCode": 404,
  "message": "Client not found",
  "error": "Not Found"
}
```

### Permission Declaration
```typescript
@Post()
@Allow(['CONTRACTS_CREATE', 'CONTRACTS_MANAGE'])
async create(@Body() dto: CreateContractDto) {
  // Method requires either permission
}
```

## Database Schema Overview

Key entities and relationships:
- **User** → Organization → Gym (multi-tenant hierarchy)
- **Gym** → GymClient → Contract → CheckIn (client lifecycle)
- **Gym** → MembershipPlan → Contract (plan management)
- **GymClient** → Evaluation (progress tracking)
- **Asset** (referenced by multiple entities for file storage)

All entities include audit fields and soft delete support.

## Preferences
- Make the code in english but the code in english.
## API Documentation

- Swagger UI available at `/api/v1/docs`
- OpenAPI spec at `/api/v1/docs-json`
- All endpoints documented with request/response examples

## Important Implementation Notes

- Always use pnpm for package management
- Never use relative imports - use 'src/' absolute imports
- Services throw exceptions, never return error objects
- All operations must include RequestContext
- Cache keys must include gymId for isolation
- Use Prisma transactions for multi-step operations
- File uploads centralized through Assets module
- Soft delete is automatic via Prisma middleware
- Use lowercase enum values to match Prisma schema
- Contract relates to Gym through gymClient, not directly
- Client numbers generated using timestamp pattern
- Use environment-specific configurations via ConfigModule