# Gym Management System - Backend Architecture Strategy

## 1. ARCHITECTURAL OVERVIEW

### **Technology Stack**
- **Backend:** NestJS with Fastify adapter
- **Database:** PostgreSQL with Prisma ORM
- **Cache:** Redis with @nestjs/cache-manager
- **Authentication:** Supabase Auth
- **File Storage:** AWS S3 (MinIO for local development)
- **API Documentation:** Swagger/OpenAPI
- **SDK Package:** TypeScript SDK for API consumption
- **Package Manager:** pnpm (monorepo)
- **Validation:** class-validator + class-transformer
- **Scheduling:** @nestjs/schedule
- **Local Development:** Docker Compose (PostgreSQL + Redis + MinIO)

### **Architecture Principles**
- **Clean Architecture:** Separation of concerns with clear boundaries
- **Modular Monolith:** Domain-driven modules with clear interfaces
- **Exception-First:** No error returns, only exceptions
- **Context-Aware:** Request context drives permissions and data access
- **Asset-Centralized:** Single module for all file/asset management
- **Permission-Based:** Declarative permission system with decorators

---

## 2. PROJECT STRUCTURE

### **Monorepo Organization**
```
gym-management/
├── packages/
│   ├── api/                    # NestJS Backend API
│   ├── sdk/                    # TypeScript SDK Package
│   └── shared/                 # Shared types, interfaces, permissions
├── tools/                      # Build tools and scripts
├── docs/                       # Architecture and API documentation
├── docker/                     # Docker configurations
│   ├── docker-compose.yml     # Local development services
│   ├── docker-compose.prod.yml # Production setup
│   └── Dockerfile.api         # API container
├── pnpm-workspace.yaml        # pnpm workspace configuration
└── package.json               # Root dependencies
```

---

## 3. BACKEND ARCHITECTURAL RULES

### **API Response Strategy**
- **Exception-Only Policy:** Services NEVER return errors, only throw exceptions
- **Standardized Responses:** All successful responses follow consistent format
- **Exception Handling:** Global exception filter transforms exceptions to HTTP responses
- **Validation Pipeline:** Automatic validation with class-validator/class-transformer

### **Request Context Architecture**
- **Context Object:** `RequestContext` class injected via decorator
- **Gym-Centric:** Gym ID passed as header, drives all data access
- **Permission Integration:** Context provides permission checking methods
- **Cache Integration:** Context includes cache layer for performance
- **Service Pattern:** `RequestContextService` with `fromRequest()` and `createEmpty()`

### **Permission System**
- **Declarative Permissions:** `@Allow()` decorator with permission constants
- **Role-Based Access:** Guards check metadata against user permissions
- **Context-Aware:** Permissions evaluated within gym/organization context
- **Generated Constants:** Script-generated permission file for type safety

### **Module Architecture**
- **Domain Modules:** Each business domain as separate module
- **Assets Module:** Centralized file/asset management with S3 integration
- **Cache Module:** Centralized caching strategy
- **Database Module:** Prisma service abstraction
- **Auth Integration:** Supabase Auth with custom guards

---

## 4. CORE ARCHITECTURAL COMPONENTS

### **RequestContext Design**
```
RequestContext Class:
├── Properties:
│   ├── user: User information from Supabase
│   ├── gym: Current gym context from header
│   ├── organization: User's organization
│   ├── permissions: Computed permissions for context
│   └── cache: Context-specific cache instance
├── Methods:
│   ├── hasPermission(permission): boolean
│   ├── canAccess(resource, action): boolean
│   ├── getGymId(): string
│   ├── getOrganizationId(): string
│   └── getUserId(): string
└── Factory Methods:
    ├── fromRequest(request): RequestContext
    └── createEmpty(): RequestContext
```

### **Permission System Design**
```
Permission Architecture:
├── @Allow(permissions[]) Decorator
├── PermissionGuard (checks metadata)
├── Generated Permissions File:
│   ├── CLIENTS_CREATE
│   ├── CLIENTS_READ
│   ├── CLIENTS_UPDATE
│   ├── CONTRACTS_CREATE
│   ├── CONTRACTS_APPROVE
│   └── ... (all permissions)
└── Role-Permission Mapping in Database
```

### **Assets Module Strategy**
```
Assets Module Design:
├── Centralized CRUD Operations
├── S3 Integration with Multer
├── Asset Entity:
│   ├── id: UUID (referenced by other entities)
│   ├── filename: string
│   ├── path: string (S3 path)
│   ├── mimetype: string
│   └── metadata: JSON
├── Operations:
│   ├── upload(file, context): Asset
│   ├── download(id, context): Stream
│   ├── delete(id, context): void
│   └── getUrl(id, context): string
└── Usage: Other entities store only asset IDs
```

### **Cache Strategy**
```
Redis Cache Integration:
├── Module-Level Caching with Redis
├── RequestContext Cache Instance
├── Cache Keys Strategy:
│   ├── gym:{gymId}:clients
│   ├── gym:{gymId}:contracts:active
│   ├── user:{userId}:permissions
│   └── organization:{orgId}:subscription
├── TTL Strategy:
│   ├── User permissions: 15 minutes
│   ├── Gym data: 30 minutes
│   ├── Static data: 60 minutes
│   └── Reports: 5 minutes
├── Invalidation on mutations
└── Redis Cluster for production
```

### **Local Development Setup**
```
Docker Compose Services:
├── PostgreSQL:
│   ├── Version: 15
│   ├── Port: 5432
│   ├── Volume persistence
│   └── Custom configuration
├── Redis:
│   ├── Version: 7
│   ├── Port: 6379
│   ├── Memory configuration
│   └── Persistence enabled
└── MinIO (S3 Alternative):
    ├── Port: 9000 (API), 9001 (Console)
    ├── Default buckets setup
    ├── Access/Secret keys
    └── Volume persistence
```

---

## 5. MODULE DESIGN PATTERNS

### **Standard Module Structure**
```
Each Domain Module:
├── Controllers:
│   ├── @Allow() decorators for permissions
│   ├── @RequestContext() injection
│   ├── Swagger documentation with reusable schemas
│   ├── Standardized pagination implementation
│   └── Validation DTOs with shared patterns
├── Services:
│   ├── Business logic implementation
│   ├── Exception throwing (no error returns)
│   ├── Context-aware operations
│   ├── Pagination service integration
│   └── Cache integration
├── DTOs:
│   ├── class-validator decorations
│   ├── class-transformer decorations
│   ├── Shared pagination DTOs
│   ├── Reusable Swagger schemas
│   └── Type safety with generics
├── Entities:
│   ├── Prisma model integration
│   ├── Relationship definitions
│   └── Validation rules
└── Tests:
    ├── Unit tests for services
    ├── Integration tests for controllers
    ├── Pagination testing patterns
    └── Mock RequestContext
```

### **Pagination Architecture**
```
Pagination Service Design:
├── Generic Pagination Service:
│   ├── paginate<T>(query, options): PaginatedResult<T>
│   ├── buildPaginationMeta(count, page, limit)
│   ├── validatePaginationParams(params)
│   └── createPaginationLinks(baseUrl, meta)
├── Standardized DTOs:
│   ├── PaginationQueryDto (page, limit, sort, order)
│   ├── PaginatedResponseDto<T> (data, meta)
│   └── PaginationMetaDto (total, page, limit, pages)
├── Swagger Reusable Schemas:
│   ├── @ApiPaginationQuery() decorator
│   ├── @ApiPaginatedResponse(EntityDto) decorator
│   └── Generic pagination response schemas
└── Controller Integration:
    ├── Automatic pagination parameter validation
    ├── Consistent response format
    ├── Type-safe entity responses
    └── Swagger documentation generation
```

### **Database Service Pattern**
```
Prisma Service Design:
├── Abstraction Layer over Prisma Client
├── Context-Aware Queries:
│   ├── Automatic gym/organization filtering
│   ├── Permission-based data access
│   └── Audit trail integration
├── Transaction Management:
│   ├── Service-level transactions
│   ├── Rollback on exceptions
│   └── Context preservation
└── Query Optimization:
    ├── Eager loading strategies
    ├── Pagination standards
    └── Performance monitoring
```

---

## 6. SDK PACKAGE DESIGN

### **TypeScript SDK Architecture**
```
TypeScript SDK:
├── Generated from OpenAPI spec
├── Type-safe method signatures
├── Authentication integration
├── Request/Response interceptors
├── Error handling abstractions
├── Retry mechanisms
├── Cache integration
└── TypeScript declarations
```

### **SDK Features**
- **Auto-generated:** From Swagger/OpenAPI specification using Orval
- **Type Safety:** Full TypeScript support with interfaces
- **Authentication:** Configurable token strategies (native, localStorage)
- **Error Handling:** Consistent error response mapping
- **Request Interceptors:** Automatic gym context headers
- **Response Caching:** Built-in caching strategies
- **Declarative API:** Clean entity-based method access pattern

### **SDK Architecture Pattern**
```
SDK Usage Pattern:
├── Initialization:
│   └── new GymSpaceSdk(baseUrl, tokenStrategy)
├── Entity Access:
│   ├── sdk.clients.list(params)
│   ├── sdk.clients.create(data)
│   ├── sdk.clients.update(id, data)
│   ├── sdk.clients.delete(id)
│   └── sdk.clients.getById(id)
├── Token Strategies:
│   ├── 'native': Platform-specific storage
│   ├── 'localStorage': Browser localStorage
│   └── Custom strategy implementation
└── Pagination Support:
    ├── Standardized pagination params
    ├── Consistent response format
    └── Automatic type inference
```

### **Orval Configuration Strategy**
```
Orval SDK Generation:
├── Base API generation from OpenAPI spec
├── Custom SDK wrapper class (GymSpaceSdk)
├── Token strategy abstraction layer
├── Entity-based method organization
├── Pagination response standardization
├── Type-safe parameter validation
└── Automatic retry and error handling
```

---

## 7. SECURITY ARCHITECTURE

### **Authentication Flow**
```
Supabase Auth Integration:
├── JWT Token Validation
├── Refresh Token Handling
├── Role-Based Access Control
├── Session Management
├── Multi-Gym Access Control
└── Invitation-Based Registration
```

### **Authorization Strategy**
```
Permission-Based Authorization:
├── RequestContext drives permissions
├── Gym-scoped data access
├── Organization-level controls
├── Role inheritance patterns
├── Resource-level permissions
└── Audit logging
```

---

## 8. OPERATIONAL ARCHITECTURE

### **Scheduled Tasks**
```
@nestjs/schedule Integration:
├── Contract Expiration Checker:
│   ├── Daily execution
│   ├── Multi-gym processing
│   ├── Status updates
│   └── Notification triggers
├── Subscription Monitoring:
│   ├── Plan limit enforcement
│   ├── Usage analytics
│   └── Billing alerts
└── Data Cleanup:
    ├── Expired tokens
    ├── Old check-ins
    └── Temporary files
```

### **Monitoring and Logging**
```
Observability Strategy:
├── Structured Logging:
│   ├── Request context in logs
│   ├── Performance metrics
│   ├── Error tracking
│   └── Audit trails
├── Health Checks:
│   ├── Database connectivity
│   ├── S3 availability
│   ├── Cache status
│   └── Supabase integration
└── Performance Monitoring:
    ├── API response times
    ├── Database query performance
    ├── Cache hit rates
    └── Resource utilization
```

---

## 9. DEVELOPMENT WORKFLOW

### **Code Organization Rules**
- **Single Responsibility:** Each module handles one domain
- **Dependency Injection:** All dependencies injected, no direct instantiation
- **Exception-First:** Services throw exceptions, controllers handle them
- **Context-Aware:** All operations consider RequestContext
- **Type-Safe:** Full TypeScript coverage with strict mode
- **Reusable Components:** Shared services, DTOs, and decorators
- **Declarative Methods:** Clear, descriptive method names and patterns
- **Pagination Standards:** Consistent pagination across all list endpoints
- **Swagger Reusability:** Shared schemas and decorators to avoid code duplication

### **SDK Generation Workflow**
```
Orval Integration:
├── Development Workflow:
│   ├── NestJS app exposes OpenAPI spec
│   ├── Orval watches for spec changes
│   ├── Auto-generates base API client
│   ├── Custom GymSpaceSdk wrapper enhances client
│   └── Token strategies inject authentication
├── Build Pipeline:
│   ├── Generate API spec from NestJS
│   ├── Run Orval to create base client
│   ├── Build enhanced SDK wrapper
│   ├── Run type checking and tests
│   └── Package for distribution
└── SDK Architecture:
    ├── Base client (Orval generated)
    ├── GymSpaceSdk wrapper class
    ├── Token strategy implementations
    ├── Entity access layer
    └── Type definitions and interfaces
```

### **Pagination Service Integration**
```
Backend Pagination Standards:
├── Generic Service:
│   ├── Handles all pagination logic
│   ├── Database query optimization
│   ├── Consistent response formatting
│   └── Type-safe implementations
├── Controller Pattern:
│   ├── @ApiPaginationQuery() decorator usage
│   ├── PaginationQueryDto validation
│   ├── Service method integration
│   └── @ApiPaginatedResponse() documentation
├── Response Format:
│   ├── Standardized across all endpoints
│   ├── Automatic meta information
│   ├── Type-safe entity data
│   └── Navigation links generation
└── SDK Integration:
    ├── Consistent pagination parameters
    ├── Type-safe response handling
    ├── Automatic pagination state management
    └── Declarative list method patterns
```

### **Validation Strategy**
```
Validation Pipeline:
├── DTO Validation (class-validator)
├── Permission Validation (@Allow guard)
├── Business Rule Validation (services)
├── Data Integrity Validation (Prisma)
└── Context Validation (RequestContext)
```

### **Testing Strategy**
```
Testing Approach:
├── Unit Tests:
│   ├── Service logic testing
│   ├── Mock RequestContext
│   ├── Exception scenarios
│   └── Permission checking
├── Integration Tests:
│   ├── Controller endpoints
│   ├── Database operations
│   ├── Authentication flows
│   └── File upload/download
└── E2E Tests:
    ├── Complete user flows
    ├── Multi-gym scenarios
    ├── Permission boundaries
    └── Error handling
```

---

## 10. DEPLOYMENT ARCHITECTURE

### **Environment Strategy**
```
Environment Configuration:
├── Development (Local):
│   ├── Docker Compose setup:
│   │   ├── PostgreSQL container
│   │   ├── Redis container
│   │   └── MinIO container (S3 alternative)
│   ├── Supabase development project
│   ├── Hot reload enabled
│   └── Local file storage fallback
├── Staging:
│   ├── Managed PostgreSQL
│   ├── Redis cluster
│   ├── S3 staging bucket
│   ├── Supabase staging project
│   └── Performance monitoring
└── Production:
    ├── Managed PostgreSQL
    ├── Redis cluster
    ├── S3 production bucket
    ├── Supabase production project
    └── Full monitoring suite
```

### **Scalability Considerations**
```
Scaling Strategy:
├── Horizontal Scaling:
│   ├── Stateless API design
│   ├── Database connection pooling
│   ├── Cache layer separation
│   └── Load balancer ready
├── Performance Optimization:
│   ├── Query optimization
│   ├── Response caching
│   ├── Asset CDN distribution
│   └── Background job processing
└── Resource Management:
    ├── Memory optimization
    ├── CPU profiling
    ├── Database indexing
    └── File storage limits
```

This architecture strategy provides a comprehensive foundation for building a scalable, maintainable, and secure gym management system that follows modern development practices and patterns.