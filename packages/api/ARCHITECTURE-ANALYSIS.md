# GymSpace API Architecture Analysis

## Executive Summary

The GymSpace API is a well-structured NestJS application using **Fastify** as the HTTP adapter (not Express). It follows a modular monolith architecture with clear separation of concerns, implementing Clean Architecture principles with an exception-first approach and context-aware multi-tenancy.

## Technology Stack

### Core Framework
- **NestJS** with **Fastify** adapter for high-performance HTTP handling
- **TypeScript** for type safety
- **Prisma ORM** for database access with PostgreSQL
- **Redis** for caching via cache-manager
- **Supabase** for authentication
- **AWS S3/MinIO** for file storage

### Key Dependencies
- `@nestjs/platform-fastify` - Fastify integration
- `@fastify/multipart` - File upload handling
- `@fastify/helmet` - Security headers
- `@nestjs/swagger` - API documentation
- `@nestjs/schedule` - Cron jobs and scheduled tasks

## Architecture Patterns

### 1. Module Organization

```
src/
├── core/                    # Core infrastructure modules
│   ├── auth/               # Supabase authentication
│   ├── cache/              # Redis caching layer
│   └── database/           # Prisma ORM service
├── common/                  # Shared utilities
│   ├── decorators/         # Custom decorators (@Allow, @RequestContext)
│   ├── exceptions/         # Custom exception classes
│   ├── filters/            # Global exception filter
│   ├── guards/             # Permission and auth guards
│   ├── interceptors/       # Request context interceptor
│   └── services/           # Common services (pagination, request context)
├── modules/                 # Business domain modules
│   ├── assets/             # File management (needs Fastify fix)
│   ├── auth/               # Business auth logic
│   ├── check-ins/          # Gym check-in tracking
│   ├── clients/            # Client management
│   ├── contracts/          # Contract management
│   ├── evaluations/        # Client evaluations
│   ├── gyms/               # Gym management
│   ├── health/             # Health checks
│   ├── invitations/        # Collaborator invitations
│   ├── leads/              # Lead management
│   ├── membership-plans/   # Membership plans
│   ├── organizations/      # Organization management
│   └── public-catalog/     # Public gym catalog
└── config/                  # Configuration files
```

### 2. Core Design Principles

#### Exception-First Approach
- Services **never return errors**, only throw exceptions
- Custom exceptions: `BusinessException`, `ValidationException`, `ResourceNotFoundException`, `AuthorizationException`
- Global exception filter transforms exceptions to appropriate HTTP responses

#### Request Context Pattern
```typescript
interface IRequestContext {
  getUserId(): string;
  getGymId(): string;
  getOrganizationId(): string;
  hasPermission(permission: string): boolean;
  // ... other context methods
}
```
- Every request has a context containing user info, gym context, and permissions
- Injected via `@RequestContext()` decorator
- Enables multi-tenant data isolation

#### Permission-Based Authorization
- Declarative permissions using `@Allow(['PERMISSION_NAME'])` decorator
- Role-based access control (Owner, Manager, Staff, Advisor)
- Guards check permissions against user's role in the request context

### 3. Multi-Tenancy Architecture

- **Gym-level isolation**: All data is scoped to a specific gym
- **Gym ID from header**: `X-Gym-Id` header determines the gym context
- **Automatic filtering**: Prisma queries automatically filter by gym ID
- **Complete data isolation**: No cross-gym data access

### 4. Fastify-Specific Implementation

#### Main Configuration (main.ts)
```typescript
const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter({ logger: true })
);

// Fastify plugins
await app.register(fastifyHelmet, { /* security config */ });
await app.register(fastifyMultipart, { 
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});
```

#### Current Issues
- **Assets module uses Express/Multer** instead of Fastify multipart
- Type mismatches between Express and Fastify request/response objects
- Need to adapt file handling to Fastify's streaming approach

## Security Architecture

### Authentication & Authorization
1. **Supabase JWT validation** for authentication
2. **Role-based permissions** stored in database
3. **Request context** carries user permissions
4. **Guards** enforce access control at route level

### Security Measures
- Helmet for security headers
- CORS configuration with specific origins
- Input validation with class-validator
- Whitelist-only validation (forbidNonWhitelisted)
- SQL injection prevention via Prisma
- File upload size limits

## Data Architecture

### Database Design
- **PostgreSQL** with Prisma ORM
- **Soft deletes** on all entities (deletedAt field)
- **Audit fields**: createdByUserId, updatedByUserId, createdAt, updatedAt
- **UUID** primary keys
- **Enums** for status fields

### Caching Strategy
- **Redis** for performance optimization
- **Key pattern**: `gym:{gymId}:{resource}`
- **TTL strategy**: 
  - User permissions: 15 minutes
  - Gym data: 30 minutes
  - Static data: 60 minutes
- **Cache invalidation** on mutations

## API Design

### RESTful Endpoints
- Consistent URL patterns: `/api/v1/{resource}`
- Standard HTTP methods (GET, POST, PUT, DELETE)
- Pagination on list endpoints
- Consistent response format

### Response Format
```json
{
  "data": {},
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### Swagger Documentation
- Auto-generated from decorators
- Available at `/api/v1/docs`
- Includes authentication schemes
- Tag-based organization

## Performance Considerations

### Fastify Advantages
- **3x faster** than Express for JSON serialization
- **Lower memory footprint**
- **Schema-based validation** (when properly configured)
- **Streaming support** for file uploads

### Current Optimizations
- Redis caching for frequently accessed data
- Pagination to limit data transfer
- Eager loading strategies in Prisma
- Connection pooling for database

## Areas for Improvement

### 1. Assets Module Migration
- Replace Express/Multer with Fastify multipart
- Use Fastify's streaming for better memory efficiency
- Adapt types from Express.Multer.File to Fastify multipart

### 2. Schema Validation
- Implement Fastify JSON schema validation
- Could improve performance by 20-30%
- Type generation from schemas

### 3. Request/Response Serialization
- Leverage Fastify's fast-json-stringify
- Define output schemas for faster serialization

### 4. Error Handling
- Ensure all Fastify-specific errors are properly handled
- Add Fastify error codes to exception handling

## Monorepo Structure

```
gymspace/
├── packages/
│   ├── api/          # NestJS backend
│   ├── sdk/          # TypeScript SDK
│   └── shared/       # Shared types and constants
├── docker/           # Docker configurations
├── docs/             # Documentation
└── tools/            # Build tools
```

### Package Management
- **pnpm** workspace for efficient dependency management
- Shared types between packages
- SDK auto-generation from OpenAPI spec

## Development Workflow

### Local Development
- Docker Compose for PostgreSQL, Redis, MinIO
- Hot reload with NestJS watch mode
- Prisma migrations for database schema
- Seeding for test data

### Code Quality
- TypeScript strict mode
- ESLint for code standards
- Prettier for formatting
- Jest for testing

## Recommendations

1. **Complete Fastify Migration**: Update assets module to use Fastify multipart
2. **Implement Fastify Schemas**: Add JSON schemas for validation and serialization
3. **Add Request ID Tracking**: Implement request ID for better debugging
4. **Enhance Monitoring**: Add APM and structured logging
5. **Implement Rate Limiting**: Use Fastify rate limit plugin
6. **Add Compression**: Enable Fastify compress plugin
7. **WebSocket Support**: Consider Fastify WebSocket for real-time features

## Conclusion

The GymSpace API demonstrates solid architectural patterns with clear separation of concerns, proper multi-tenancy, and security considerations. The main technical debt is the incomplete migration from Express patterns to Fastify, particularly in the assets module. Addressing this will unlock Fastify's performance benefits and ensure consistency across the codebase.