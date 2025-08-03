# GymSpace Backend Implementation Plans

## 📋 Overview

This document outlines the implementation plans for the GymSpace backend system, broken down into manageable phases with specific deliverables and timelines.

## 🎯 Project Goals

- Build a scalable multi-tenant gym management system
- Implement clean architecture with NestJS
- Create a type-safe API with comprehensive documentation
- Generate TypeScript SDK for frontend consumption
- Ensure security, performance, and maintainability

---

## 📅 Phase 1: Foundation & Infrastructure
**Duration:** Week 1  
**Goal:** Setup project structure and development environment

### Tasks

#### 1.1 Monorepo Setup
- [ ] Initialize pnpm workspace configuration
- [ ] Create packages directory structure:
  ```
  packages/
  ├── api/      # NestJS backend
  ├── sdk/      # TypeScript SDK
  └── shared/   # Shared types/interfaces
  ```
- [ ] Configure root `package.json` with workspace scripts
- [ ] Setup shared TypeScript configuration
- [ ] Configure ESLint and Prettier for consistency
- [ ] Setup Git hooks with Husky for pre-commit checks

#### 1.2 Docker Environment
- [ ] Create `docker/` directory structure
- [ ] Configure PostgreSQL 15 container:
  - Database initialization scripts
  - Volume persistence
  - Development credentials
- [ ] Setup Redis 7 container:
  - Memory configuration
  - Persistence settings
- [ ] Configure MinIO (S3 alternative):
  - Default buckets creation
  - Access credentials
  - Web console access
- [ ] Create `docker-compose.yml` for local development
- [ ] Add `docker-compose.prod.yml` for production reference
- [ ] Document Docker setup in README

#### 1.3 NestJS Project Initialization
- [ ] Initialize NestJS with Fastify adapter in `packages/api`
- [ ] Configure environment variables:
  - Database connection
  - Redis connection
  - S3/MinIO credentials
  - Supabase configuration
  - JWT settings
- [ ] Setup configuration module with validation
- [ ] Configure CORS and security middleware
- [ ] Setup health check endpoints
- [ ] Configure logging with Winston

#### 1.4 Development Tools
- [ ] Setup nodemon for hot reload
- [ ] Configure debugging for VSCode
- [ ] Create development scripts:
  - `dev`: Start all services
  - `dev:api`: Start only API
  - `dev:docker`: Start Docker services
- [ ] Setup initial CI/CD pipeline structure

### Deliverables
- ✅ Working monorepo structure
- ✅ Docker development environment
- ✅ Basic NestJS application running
- ✅ Development workflow documented

---

## 📅 Phase 2: Core Infrastructure
**Duration:** Week 2  
**Goal:** Implement foundational architecture components

### Tasks

#### 2.1 Database Schema Implementation
- [ ] Install and configure Prisma ORM
- [ ] Create complete Prisma schema with all 19 entities:
  - Core entities (Users, Organizations, Gyms)
  - Access control (Roles, Collaborators, Invitations)
  - Business entities (Clients, Plans, Contracts)
  - Evaluation system entities
  - Asset management entities
- [ ] Implement soft delete middleware:
  ```typescript
  // Auto-filter deleted records
  // Handle deleted_at timestamps
  // Preserve referential integrity
  ```
- [ ] Add audit fields middleware:
  ```typescript
  // Auto-populate created_by_user_id
  // Update updated_by_user_id on changes
  // Manage timestamps
  ```
- [ ] Create initial migration
- [ ] Setup seed data for development

#### 2.2 RequestContext System
- [ ] Create `RequestContextService`:
  ```typescript
  class RequestContextService {
    fromRequest(request): RequestContext
    createEmpty(): RequestContext
  }
  ```
- [ ] Implement `RequestContext` class:
  - User information from JWT
  - Current gym context
  - Organization details
  - Computed permissions
  - Cache instance
- [ ] Create `@RequestContext()` decorator
- [ ] Setup context injection in controllers
- [ ] Implement gym/organization scoping logic
- [ ] Add context-aware query filters

#### 2.3 Exception Handling Architecture
- [ ] Create custom exception classes:
  - BusinessException
  - ValidationException
  - AuthorizationException
  - ResourceNotFoundException
- [ ] Implement global exception filter
- [ ] Configure exception-to-HTTP mapping
- [ ] Setup validation pipeline with class-validator
- [ ] Create standardized error response format
- [ ] Add request ID tracking for debugging

#### 2.4 Permission System Foundation
- [ ] Design permission structure and naming convention
- [ ] Create permission constants generator script
- [ ] Implement `@Allow()` decorator
- [ ] Create `PermissionGuard`:
  - Extract metadata from decorators
  - Check against user permissions
  - Context-aware evaluation
- [ ] Setup role-permission mapping table
- [ ] Create permission checking service

### Deliverables
- ✅ Complete database schema with migrations
- ✅ Working RequestContext system
- ✅ Exception handling pipeline
- ✅ Basic permission system

---

## 📅 Phase 3: Authentication & Authorization
**Duration:** Week 3  
**Goal:** Implement secure authentication with Supabase

### Tasks

#### 3.1 Supabase Integration
- [ ] Configure Supabase client
- [ ] Implement JWT validation strategy
- [ ] Create authentication guards:
  - Public routes guard
  - Authenticated routes guard
  - Permission-based guard
- [ ] Setup user synchronization:
  - Sync Supabase users to local database
  - Handle user metadata
- [ ] Implement refresh token handling
- [ ] Add session management

#### 3.2 Multi-tenancy Implementation
- [ ] Create organization selection middleware
- [ ] Implement gym context header parsing
- [ ] Add data isolation filters:
  - Automatic gym_id filtering
  - Organization boundary enforcement
- [ ] Create tenant switching logic
- [ ] Implement cross-tenant access prevention

#### 3.3 Authorization Framework
- [ ] Integrate permission system with guards
- [ ] Create role hierarchy:
  - Owner (full access)
  - Manager (limited admin)
  - Staff (basic access)
  - Advisor (evaluation access)
- [ ] Implement resource-level permissions
- [ ] Add permission caching strategy
- [ ] Create authorization testing utilities

### Deliverables
- ✅ Supabase authentication working
- ✅ Multi-tenant data isolation
- ✅ Role-based access control
- ✅ Permission evaluation system

---

## 📅 Phase 4: Core Business Modules
**Duration:** Weeks 4-5  
**Goal:** Implement fundamental business entities

### Tasks

#### 4.1 User & Organization Modules
- [ ] **User Module:**
  - User CRUD operations
  - Profile management
  - Password reset flow
  - Email verification
- [ ] **Organization Module:**
  - Organization creation/update
  - Subscription plan management
  - Usage tracking
  - Settings management (currency, timezone)
  - Plan limit enforcement

#### 4.2 Gym Management Module
- [ ] Gym CRUD with plan limits
- [ ] Gym configuration management:
  - Evaluation structure setup
  - Public catalog settings
- [ ] Gym code generation for invitations
- [ ] Profile and cover image handling
- [ ] Gym switching functionality

#### 4.3 Collaborator System
- [ ] **Invitation Module:**
  - Generate invitation tokens
  - Send invitation emails
  - Track invitation status
  - Handle expiration
- [ ] **Collaborator Module:**
  - Accept invitations
  - Collaborator profiles
  - Role assignment
  - Status management
  - Schedule configuration

#### 4.4 Asset Management Module
- [ ] Configure S3/MinIO client
- [ ] Implement file upload service:
  - Multi-part upload support
  - File type validation
  - Size restrictions
  - Virus scanning hook
- [ ] Create asset CRUD operations
- [ ] Implement secure URL generation
- [ ] Add image optimization pipeline
- [ ] Setup CDN integration prep

### Deliverables
- ✅ Complete user management system
- ✅ Organization with subscription handling
- ✅ Gym management with limits
- ✅ Collaborator invitation system
- ✅ Centralized asset management

---

## 📅 Phase 5: Client & Membership Management
**Duration:** Weeks 6-7  
**Goal:** Implement client management and contract system

### Tasks

#### 5.1 Client Management Module
- [ ] Client registration with auto-numbering
- [ ] Client profile management:
  - Personal information
  - Medical conditions
  - Emergency contacts
- [ ] Client search and filtering:
  - By name, document, number
  - Active/inactive status
  - Advanced filters
- [ ] Client document management
- [ ] Client import/export functionality

#### 5.2 Membership Plans Module
- [ ] Plan creation with features:
  - Pricing configuration
  - Duration settings
  - Custom pricing allowance
  - Evaluation limits
  - Advisor inclusion
- [ ] Plan templates system
- [ ] Plan activation/deactivation
- [ ] Plan comparison tools
- [ ] Terms and conditions management

#### 5.3 Contract Lifecycle Module
- [ ] **Contract Creation:**
  - Plan selection
  - Custom pricing application
  - Discount calculations
  - Payment frequency setup
- [ ] **Document Management:**
  - Payment receipt upload
  - Contract document handling
  - Required document validation
- [ ] **Status Management:**
  - Pending → Active workflow
  - Automatic expiration
  - Manual cancellation
  - Renewal process
- [ ] **Scheduled Tasks:**
  - Daily status checker
  - Expiration notifications
  - Auto-status updates

#### 5.4 Pricing Engine
- [ ] Base price calculation
- [ ] Custom price overrides
- [ ] Discount application:
  - Percentage discounts
  - Fixed amount discounts
- [ ] Currency handling
- [ ] Price history tracking

### Deliverables
- ✅ Complete client management
- ✅ Flexible membership plans
- ✅ Contract lifecycle automation
- ✅ Advanced pricing engine

---

## 📅 Phase 6: Advanced Features
**Duration:** Week 8  
**Goal:** Implement evaluation system and access control

### Tasks

#### 6.1 Evaluation System
- [ ] **Evaluation Management:**
  - Create evaluations with types (initial, progress, final)
  - Advisor assignment
  - Duration tracking
  - Status workflow
- [ ] **Data Collection:**
  - Dynamic form based on gym structure
  - Initial data capture
  - Final data comparison
  - Progress calculation
- [ ] **Comment System:**
  - Progress notes
  - Call logs
  - Meeting records
  - Private comments
- [ ] **Asset Integration:**
  - Before/after photos
  - Progress images
  - Document attachments

#### 6.2 Check-in System
- [ ] Access validation against active contracts
- [ ] Check-in registration with timestamps
- [ ] Bulk check-in support
- [ ] Check-in history and analytics:
  - Frequency tracking
  - Peak hours analysis
  - Member attendance patterns
- [ ] QR code generation for members

#### 6.3 Notification System
- [ ] Notification service architecture
- [ ] Email notification templates:
  - Welcome emails
  - Contract expiration
  - Evaluation reminders
- [ ] In-app notifications
- [ ] Notification preferences
- [ ] Delivery tracking

#### 6.4 Reporting Module
- [ ] Dashboard widgets:
  - Active clients count
  - Expiring contracts
  - Daily check-ins
  - Revenue metrics
- [ ] Financial reports:
  - Monthly revenue
  - Plan performance
  - Payment tracking
- [ ] Attendance reports
- [ ] Export functionality (PDF, Excel)

### Deliverables
- ✅ Complete evaluation system
- ✅ Check-in with analytics
- ✅ Notification pipeline
- ✅ Comprehensive reporting

---

## 📅 Phase 7: API Documentation & SDK
**Duration:** Week 9  
**Goal:** Complete API documentation and SDK generation

### Tasks

#### 7.1 OpenAPI/Swagger Documentation
- [ ] Configure Swagger module with themes
- [ ] Document all endpoints:
  - Clear descriptions
  - Request/response examples
  - Error scenarios
- [ ] Add authentication documentation
- [ ] Create API versioning strategy
- [ ] Generate Postman collection
- [ ] Setup ReDoc for better visualization

#### 7.2 TypeScript SDK Development
- [ ] Configure Orval for code generation
- [ ] Create SDK wrapper class:
  ```typescript
  class GymSpaceSdk {
    constructor(baseUrl, tokenStrategy)
    clients: ClientsApi
    contracts: ContractsApi
    // ... other entities
  }
  ```
- [ ] Implement token strategies:
  - Native storage
  - LocalStorage
  - Custom strategy interface
- [ ] Add request interceptors
- [ ] Implement retry logic
- [ ] Create usage examples

#### 7.3 API Standards
- [ ] Implement pagination standards:
  - Consistent query parameters
  - Metadata format
  - Cursor-based option
- [ ] Standardize error responses
- [ ] Add rate limiting
- [ ] Implement API key authentication option
- [ ] Create webhook system design

### Deliverables
- ✅ Complete API documentation
- ✅ Auto-generated TypeScript SDK
- ✅ API standards implemented
- ✅ Developer portal ready

---

## 📅 Phase 8: Testing & Optimization
**Duration:** Week 10  
**Goal:** Ensure quality and performance

### Tasks

#### 8.1 Testing Implementation
- [ ] **Unit Tests:**
  - Service layer coverage (>80%)
  - Mock RequestContext
  - Exception scenarios
- [ ] **Integration Tests:**
  - Controller endpoints
  - Database operations
  - Permission flows
- [ ] **E2E Tests:**
  - Complete user journeys
  - Multi-tenant scenarios
  - Contract lifecycle
- [ ] **Performance Tests:**
  - Load testing
  - Stress testing
  - Database query analysis

#### 8.2 Performance Optimization
- [ ] Database optimization:
  - Index analysis
  - Query optimization
  - N+1 query prevention
- [ ] Caching implementation:
  - Redis integration
  - Cache warming
  - Invalidation strategies
- [ ] API optimization:
  - Response compression
  - Pagination tuning
  - Batch operations

#### 8.3 Security Hardening
- [ ] Security audit:
  - Dependency scanning
  - Code analysis
  - OWASP compliance
- [ ] Implement rate limiting
- [ ] Add request sanitization
- [ ] Setup monitoring and alerting
- [ ] Create security documentation

#### 8.4 Deployment Preparation
- [ ] Create production Dockerfile
- [ ] Setup environment configurations
- [ ] Database migration strategy
- [ ] Backup and recovery procedures
- [ ] Monitoring setup:
  - Health checks
  - Metrics collection
  - Log aggregation
- [ ] Create deployment documentation

### Deliverables
- ✅ >80% test coverage
- ✅ Performance benchmarks met
- ✅ Security audit passed
- ✅ Production-ready deployment

---

## 📊 Success Metrics

### Technical Metrics
- API response time <200ms for 95% of requests
- Zero critical security vulnerabilities
- Test coverage >80%
- Zero data isolation breaches
- 99.9% uptime SLA capability

### Business Metrics
- Support for 1000+ concurrent users
- Multi-tenant isolation verified
- All 19 entities fully implemented
- Complete CRUD operations for all modules
- Full audit trail capability

### Developer Experience
- Complete API documentation
- Working TypeScript SDK
- Local development <5 min setup
- Comprehensive error messages
- Example requests for all endpoints

---

## 🚀 Next Steps

After Phase 8 completion:

1. **Production Deployment**
   - Cloud infrastructure setup
   - CI/CD pipeline completion
   - Monitoring and alerting
   - Backup strategies

2. **Feature Expansion**
   - Mobile app API adjustments
   - Advanced analytics
   - Third-party integrations
   - Webhook implementations

3. **Scaling Preparation**
   - Microservices evaluation
   - Read replica setup
   - Caching layer expansion
   - CDN implementation

---

## 📝 Notes

- Each phase builds upon the previous one
- Adjust timelines based on team size and complexity discoveries
- Maintain backward compatibility throughout development
- Document decisions and deviations from original plan
- Regular stakeholder updates at phase completions