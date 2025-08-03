# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GymSpace is a multi-tenant gym management system built as a pnpm monorepo with NestJS backend, PostgreSQL database, and Redis caching. The system implements a clean architecture with exception-first approach and context-aware permissions.

## Development Commands

### Environment Setup
```bash
# Install dependencies (use pnpm only)
pnpm install

# Start Docker services (PostgreSQL, Redis, MinIO)
pnpm run dev:docker

# Setup environment
cp packages/api/.env.example packages/api/.env
# Edit .env with Supabase credentials
```

### Running the Application
```bash
# Run all services in parallel
pnpm run dev

# Run only the API service
pnpm run dev:api

# Run mobile app
pnpm run dev:mobile

# Build all packages
pnpm run build
```

### Database Management (from packages/api)
```bash
# Generate Prisma client
pnpm run prisma:generate

# Run database migrations
pnpm run prisma:migrate

# Deploy migrations to production
pnpm run prisma:migrate:deploy

# Open Prisma Studio
pnpm run prisma:studio

# Reset database (WARNING: deletes all data)
pnpm run prisma:reset

# Seed database
pnpm run prisma:seed
```

### Testing
```bash
# Run all tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Run tests with coverage
pnpm run test:cov

# Debug tests
pnpm run test:debug

# Run E2E tests
pnpm run test:e2e
```

### Code Quality
```bash
# Run linting
pnpm run lint

# Format code
pnpm run format

# Clean all build artifacts
pnpm run clean
```

## Architecture Overview

### Core Architectural Principles

1. **Exception-First Pattern**: Services throw exceptions (BusinessException, ValidationException, ResourceNotFoundException, AuthorizationException), never return error objects. Global exception filter handles HTTP responses.

2. **RequestContext Pattern**: Every request has a RequestContext containing:
   - User information from Supabase
   - Current gym context from header
   - Computed permissions
   - Cache instance
   
3. **Permission System**: Declarative permissions using @Allow() decorator on controllers. PermissionGuard checks against user's role permissions.

4. **Multi-Tenancy**: All data is gym-scoped. RequestContext.gymId drives all queries. Complete data isolation between gyms.

5. **Audit Trail**: All entities have created_by_user_id, updated_by_user_id, created_at, updated_at, deleted_at fields.

6. **Soft Delete**: No physical deletions. All entities use deleted_at timestamp.

### Module Structure

Each domain module follows this pattern:
```
modules/[domain]/
├── [domain].controller.ts    # HTTP endpoints with @Allow() decorators
├── [domain].module.ts        # Module definition
├── [domain].service.ts       # Business logic (throws exceptions)
├── dto/                      # DTOs with class-validator decorations
│   ├── create-[entity].dto.ts
│   ├── update-[entity].dto.ts
│   └── index.ts
└── services/                 # Additional services if needed
```

### Key Services and Patterns

1. **PrismaService**: Database abstraction with automatic gym filtering
2. **CacheService**: Redis caching with RequestContext integration
3. **PaginationService**: Standardized pagination across all list endpoints
4. **AuthService**: Supabase integration for authentication
5. **RequestContextService**: Creates and manages request context

### Database Schema Patterns

- All tables have audit fields: created_by_user_id, updated_by_user_id, created_at, updated_at, deleted_at
- Foreign keys use UUID type
- Enums defined in Prisma schema
- JSON fields for flexible data (settings, metadata, features)

### API Response Format

Success responses follow this structure:
```json
{
  "data": {},
  "meta": {}
}
```

Paginated responses:
```json
{
  "data": [],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### Testing Approach

- Unit tests for services with mocked dependencies
- Integration tests for controllers with test database
- Mock RequestContext for testing
- Test both success and exception scenarios

## Common Development Tasks

### Adding a New Module

1. Create module structure under `src/modules/[domain]/`
2. Define DTOs with validation decorators
3. Implement service with exception-first pattern
4. Create controller with @Allow() decorators
5. Add module to app.module.ts imports
6. Create tests for service and controller

### Adding a New Entity

1. Define entity in `prisma/schema.prisma`
2. Run `pnpm run prisma:generate`
3. Run `pnpm run prisma:migrate`
4. Create corresponding module following patterns above

### Implementing Permissions

1. Add permission to role permissions array in database
2. Use @Allow(['PERMISSION_NAME']) on controller methods
3. PermissionGuard automatically validates against RequestContext

### Working with RequestContext

```typescript
// In controllers
@Get()
@Allow(['CLIENTS_READ'])
async findAll(@RequestContext() context: IRequestContext) {
  return this.service.findAll(context);
}

// In services
async findAll(context: IRequestContext) {
  const gymId = context.getGymId();
  // All queries automatically filtered by gymId
}
```

## Important Notes

- Never use relative imports - use absolute imports from 'src/'
- Always validate DTOs with class-validator decorators
- Use Prisma transactions for multi-step operations
- Cache keys should include gymId for proper isolation
- All file uploads go through centralized Assets module
- Swagger documentation auto-generated at /api/v1/docs

## Frontend Architecture Memory - Development Guidelines

### CORE PRINCIPLES

#### **Feature-First Architecture**
- **Always organize by features**, not by technical layers
- Each feature should be self-contained and independently testable
- Features can import from shared modules, but not from other features directly

#### **Component Size Philosophy**
- **Keep components small and focused** - single responsibility principle
- If a component exceeds 100-150 lines, consider breaking it down
- Extract complex logic into custom hooks or Jotai atoms
- Prefer composition over large monolithic components

#### **Reusability Analysis**
- **Before creating any component, ask: "Will this be used elsewhere?"**
- If yes, place it in shared/components
- If no, keep it within the feature
- When in doubt, start feature-specific and refactor to shared when needed

### PROJECT STRUCTURE

#### **Recommended Structure**
```
src/
├── features/                    # Feature modules
│   ├── auth/
│   │   ├── components/         # Feature-specific components
│   │   ├── controllers/        # SDK + TanStack Query connections
│   │   ├── helpers/           # Feature-specific utilities
│   │   ├── hooks/             # Feature-specific hooks
│   │   ├── stores/            # Jotai atoms for this feature
│   │   └── index.ts           # Public API
│   ├── clients/
│   ├── contracts/
│   ├── evaluations/
│   └── dashboard/
├── shared/                     # Reusable across features
│   ├── components/            # UI components
│   ├── hooks/                 # Shared hooks
│   ├── stores/                # Global Jotai atoms
│   ├── types/                 # TypeScript types
│   ├── utils/                 # Helper functions
│   └── constants/             # App constants
├── controllers/               # Global controllers (auth, app state)
└── app/                       # App-level configuration
```

### CONTROLLERS PATTERN

#### **Definition**
Controllers are the bridge between the SDK (API) and TanStack Query. They handle data fetching, mutations, and caching strategies.

#### **Controller Structure**
```typescript
// features/clients/controllers/clients.controller.ts
export const useClientsController = () => {
  const { gymSpaceSDK } = useSDK();

  // Queries
  const clientsQuery = useQuery({
    queryKey: ['clients'],
    queryFn: () => gymSpaceSDK.clients.list(),
  });

  const clientQuery = (id: string) => useQuery({
    queryKey: ['clients', id],
    queryFn: () => gymSpaceSDK.clients.getById(id),
    enabled: !!id,
  });

  // Mutations
  const createClientMutation = useMutation({
    mutationFn: gymSpaceSDK.clients.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  return {
    // Queries
    clients: clientsQuery.data,
    isLoading: clientsQuery.isLoading,
    error: clientsQuery.error,
    
    // Individual client
    getClient: clientQuery,
    
    // Mutations
    createClient: createClientMutation.mutate,
    isCreating: createClientMutation.isPending,
  };
};
```

#### **Controller Rules**
- **One controller per domain entity** (clients, contracts, evaluations)
- **Export custom hooks**, not raw TanStack Query hooks
- **Handle loading states and errors** within the controller
- **Manage cache invalidation** in mutations
- **Keep business logic out** - controllers only handle data flow

### JOTAI STATE MANAGEMENT

#### **When to Use Jotai**
- **Complex component state** that involves multiple pieces of data
- **Cross-component communication** within a feature
- **Form state management** for complex forms
- **UI state** that needs to persist across navigation
- **Derived state** calculations

#### **Jotai Pattern**
```typescript
// features/clients/stores/client-form.store.ts
export const clientFormAtom = atom({
  name: '',
  email: '',
  phone: '',
  birthDate: null as Date | null,
});

export const clientFormValidationAtom = atom((get) => {
  const form = get(clientFormAtom);
  return {
    isValid: form.name.length > 0 && form.email.includes('@'),
    errors: {
      name: form.name.length === 0 ? 'Name is required' : null,
      email: !form.email.includes('@') ? 'Invalid email' : null,
    },
  };
});

export const resetClientFormAtom = atom(null, (get, set) => {
  set(clientFormAtom, {
    name: '',
    email: '',
    phone: '',
    birthDate: null,
  });
});
```

#### **Jotai Rules**
- **Create atoms per feature** in feature/stores/
- **Use derived atoms** for calculations and validations
- **Keep atoms focused** - one concern per atom
- **Export both read and write atoms** when needed
- **Avoid complex objects** - prefer flat state structure

### COMPONENT GUIDELINES

#### **Component Size Limits**
- **Maximum 150 lines** per component file
- **Maximum 5 props** - if more, consider splitting
- **Single responsibility** - one main purpose per component
- **Extract when reused** - if used in 2+ places, move to shared/

#### **Component Structure**
```typescript
// Good: Small, focused component
export const ClientCard = ({ client, onEdit }: ClientCardProps) => {
  const { deleteClient } = useClientsController();
  
  return (
    <Card>
      <ClientAvatar src={client.profileImage} />
      <ClientInfo name={client.name} phone={client.phone} />
      <ClientActions onEdit={onEdit} onDelete={() => deleteClient(client.id)} />
    </Card>
  );
};

// Better: Extract sub-components
const ClientAvatar = ({ src }: { src?: string }) => (
  <Avatar src={src} fallback="CL" />
);

const ClientInfo = ({ name, phone }: { name: string; phone: string }) => (
  <div>
    <h3>{name}</h3>
    <p>{phone}</p>
  </div>
);

const ClientActions = ({ onEdit, onDelete }: ClientActionsProps) => (
  <div>
    <Button onClick={onEdit}>Edit</Button>
    <Button variant="destructive" onClick={onDelete}>Delete</Button>
  </div>
);
```

#### **Component Rules**
- **Props should be explicit** - avoid passing entire objects when only few fields needed
- **Use TypeScript interfaces** for props
- **Handle loading and error states** in data components
- **Separate presentation from logic** - use controllers and hooks

### REUSABILITY CHECKLIST

#### **Before Creating a Component**
1. **Is this used in multiple places?** → Move to shared/components
2. **Is this feature-specific but reusable within the feature?** → Keep in feature/components
3. **Does this contain complex logic?** → Extract to hooks or Jotai atoms
4. **Is this purely presentational?** → Consider making it a shared UI component

#### **Reusability Indicators**
- **UI patterns** (cards, forms, buttons) → shared/components
- **Business logic** (calculations, validations) → shared/utils or feature/helpers
- **Data fetching patterns** → shared/hooks
- **State management** (app-wide state) → shared/stores

#### **Testing Strategy**
- **Unit test shared components** individually
- **Integration test features** as complete flows
- **Test controllers** with mock SDK responses
- **Test Jotai atoms** in isolation

### FEATURE MODULE PATTERN

#### **Feature Public API**
```typescript
// features/clients/index.ts
export { ClientsList } from './components/ClientsList';
export { ClientForm } from './components/ClientForm';
export { useClientsController } from './controllers/clients.controller';
export type { Client, CreateClientData } from './types';

// Don't export internal components, helpers, or stores
```

#### **Feature Rules**
- **Export only what's needed** by other features or app
- **Keep internal implementation private**
- **Provide clear TypeScript types** for exported items
- **Document the public API** when complex

### DEVELOPMENT WORKFLOW

#### **When Building a New Feature**
1. **Start with the controller** - define data needs
2. **Create small components** - build UI piece by piece
3. **Extract logic to Jotai** when state gets complex
4. **Identify reusable parts** and move to shared/
5. **Write tests** for reusable components and controllers
6. **Document the public API** in feature/index.ts

#### **Refactoring Guidelines**
- **When a component exceeds 150 lines** → Split into smaller components
- **When logic is repeated** → Extract to shared utilities
- **When state management gets complex** → Use Jotai atoms
- **When a component is used elsewhere** → Move to shared/

#### **Code Review Checklist**
- [ ] Components are focused and under 150 lines
- [ ] Controllers handle data flow correctly
- [ ] Jotai is used for complex state, not simple component state
- [ ] Reusable parts are identified and extracted
- [ ] TypeScript types are properly defined
- [ ] Tests cover the critical paths

### ANTI-PATTERNS TO AVOID

#### **Don't Do This**
- ❌ **Prop drilling** - use Jotai for complex state
- ❌ **Monolithic components** - split into smaller pieces
- ❌ **Direct SDK calls in components** - use controllers
- ❌ **Feature-to-feature imports** - use shared/ or refactor
- ❌ **Complex logic in JSX** - extract to hooks or helpers
- ❌ **Duplicated code** - identify and extract to shared utilities

#### **Do This Instead**
- ✅ **Use controllers** for data operations
- ✅ **Compose small components** for complex UI
- ✅ **Extract reusable logic** to shared modules
- ✅ **Use Jotai atoms** for cross-component state
- ✅ **Type everything** with TypeScript
- ✅ **Test in isolation** where possible

Remember: **Favor composition over complexity, and reusability over repetition.**

## Special Reminders

- Always use `docs/backend-architecture.md` and `docs/use-cases-and-entities.md` as reference for understanding the project's architectural decisions and domain models
- Always use pnpm for package management
- Follow the exception-first pattern - services throw exceptions, never return errors
- Use RequestContext for all gym-scoped operations
- All endpoints require @Allow() decorator for permissions
- The project uses Prisma's soft delete middleware - all entities have deletedAt field
- Authentication is handled by Supabase - users don't have passwords in the database
- Use lowercase enum values in TypeScript code (e.g., 'active' not 'ACTIVE') to match Prisma schema
- Contract relates to Gym through gymClient relationship, not directly
- Always generate client numbers for new gym clients using timestamp pattern
- Use `as any` for Fastify plugin type conflicts in main.ts
- When fixing field references, check Prisma schema for exact field names
- Always read SDK documentation before implement a query or mutation
- Always use the wrapper ui fields to implement a form
- Always take a look to the case studies before add a new feature
- not use space property, use tailwind classes
- not use size property, use nativewind features instead