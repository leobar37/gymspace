# CLAUDE.md

This guide provides comprehensive guidance for working with the GymSpace codebase, a multi-tenant gym management system.

## Project Overview

GymSpace is a multi-tenant gym management system built as a pnpm monorepo with:
- **Backend**: NestJS + PostgreSQL + Redis
- **Frontend Mobile**: React Native + Expo + Gluestack UI
- **Frontend Web**: Next.js (landing page)
- **SDK**: TypeScript SDK for API communication
- **Architecture**: Clean architecture with exception-first pattern and context-based permissions

## Development Commands

### Environment Setup
```bash
# Install dependencies (use pnpm only)
pnpm install

# Start Docker services (PostgreSQL, Redis, MinIO)
pnpm run dev:docker

# Configure environment
cp packages/api/.env.example packages/api/.env
# Edit .env with Supabase credentials
```

### Run the Application
```bash
# Run all services in parallel
pnpm run dev

# Run API service only
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

# Run migrations
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

# Clean build artifacts
pnpm run clean
```

## System Architecture

### Core Architectural Principles

1. **Exception-First Pattern**: Services throw exceptions (BusinessException, ValidationException, ResourceNotFoundException, AuthorizationException), never return error objects. The global exception filter handles HTTP responses.

2. **RequestContext Pattern**: Each request has a RequestContext containing:
   - User information from Supabase
   - Current gym context from header
   - Computed permissions
   - Cache instance

3. **Permission System**: Declarative permissions using @Allow() decorator on controllers. PermissionGuard validates against user's role permissions.

4. **Multi-Tenancy**: All data is isolated by gym. RequestContext.gymId controls all queries. Complete data isolation between gyms.

5. **Audit Trail**: All entities have fields created_by_user_id, updated_by_user_id, created_at, updated_at, deleted_at.

6. **Soft Delete**: No physical deletions. All entities use deleted_at timestamp.

7. **Controller Best Practices**:
   - **NEVER pass gymId or userId as parameters** - use RequestContext instead
   - Controllers should extract gymId and userId from RequestContext
   - Services receive the full RequestContext for context-aware operations

### Backend Module Structure

Each domain module follows this pattern:
```
modules/[domain]/
├── [domain].controller.ts    # HTTP endpoints with @Allow() decorators
├── [domain].module.ts        # Module definition
├── [domain].service.ts       # Business logic (throws exceptions)
├── dto/                      # DTOs with class-validator decorators
│   ├── create-[entity].dto.ts
│   ├── update-[entity].dto.ts
│   └── index.ts
└── services/                 # Additional services if needed
```

### Key Services and Patterns

1. **PrismaService**: Database abstraction with automatic gym filtering
2. **CacheService**: Redis cache with RequestContext integration
3. **PaginationService**: Standardized pagination across all list endpoints
4. **AuthService**: Supabase integration for authentication
5. **RequestContextService**: Creates and manages request context

### Database Schema Patterns

- All tables have audit fields: created_by_user_id, updated_by_user_id, created_at, updated_at, deleted_at
- Foreign keys use UUID type
- Enums defined in Prisma schema
- JSON fields for flexible data (settings, metadata, features)

### API Response Format

Successful responses follow this structure:
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

### Feature Building Workflow

When building a new feature, follow this specific order:

1. **Backend Controller First**: Examine the backend controller in `packages/api/src/modules/[domain]/`
   - Understand available endpoints and their permissions
   - Check DTOs for required/optional fields
   - Note response formats and pagination

2. **SDK Methods Second**: Review or implement SDK methods in `packages/sdk/src/`
   - Ensure SDK methods match backend endpoints
   - Check type definitions are correct
   - Verify proper error handling

3. **Mobile Controller Last**: Implement the mobile controller in `packages/mobile/src/features/[feature]/controllers/`
   - Use SDK methods via useSDK() hook
   - Implement TanStack Query patterns
   - Handle loading, error, and success states
   - Never pass gymId or userId - backend handles via RequestContext

### Adding a New Module (Backend)

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
4. Create corresponding module following above patterns

### Implementing Permissions

1. Add permission to role's permissions array in database
2. Use @Allow(['PERMISSION_NAME']) on controller methods
3. PermissionGuard automatically validates against RequestContext

### Working with RequestContext

```typescript
// In controllers - NEVER pass gymId or userId as parameters
@Get()
@Allow([Permissions.CLIENTS_READ])
async findAll(@AppCtxt() context: IRequestContext) {
  // Extract gym context from RequestContext, not from parameters
  return this.service.findAll(context);
}

// In services
async findAll(context: IRequestContext) {
  const gymId = context.getGymId();
  const userId = context.getUserId();
  // All queries automatically filtered by gymId
  // Never accept gymId or userId as method parameters
}
```

## Important Notes

- Never use relative imports - use absolute imports from 'src/'
- Always validate DTOs with class-validator decorators
- Use Prisma transactions for multi-step operations
- Cache keys should include gymId for proper isolation
- All file uploads go through centralized Assets module
- Swagger documentation auto-generated at /api/v1/docs

## Frontend Architecture - Principles and Patterns

### CORE PRINCIPLES

#### **Feature-First Architecture**
- **Always organize by features**, not by technical layers
- Each feature must be self-contained and independently testable
- Features can import from shared modules, but not from other features directly

#### **Component Size Philosophy**
- **Keep components small and focused** - single responsibility principle
- If a component exceeds 100-150 lines, consider splitting it
- Extract complex logic to custom hooks or Jotai atoms
- Prefer composition over large monolithic components

#### **Reusability Analysis**
- **Before creating any component, ask: "Will it be used elsewhere?"**
- If yes, place in shared/components
- If no, keep within the feature
- When in doubt, start feature-specific and refactor to shared when needed

### CONTROLLER PATTERN

#### **Definition**
Controllers are the bridge between SDK (API) and TanStack Query. They handle data fetching, mutations, and caching strategies.

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
- **Handle loading and error states** within the controller
- **Manage cache invalidation** in mutations
- **Keep business logic out** - controllers only handle data flow
- **NEVER pass gymId or userId as parameters** - these are handled by the backend via RequestContext

### STATE MANAGEMENT WITH JOTAI

#### **When to Use Jotai**
- **Complex component state** involving multiple pieces of data
- **Cross-component communication** within a feature
- **Form state management** for complex forms
- **UI state** that needs to persist across navigation
- **Derived state calculations**

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
- **Export read and write atoms** when necessary
- **Avoid complex objects** - prefer flat state structure

### COMPONENT GUIDELINES

#### **Component Size Limits**
- **Maximum 150 lines** per component file
- **Maximum 5 props** - if more, consider splitting
- **Single responsibility** - one main purpose per component
- **Extract when reused** - if used in 2+ places, move to shared/

#### **Component Structure**
```typescript
// Good: Small and focused component
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
- **Props must be explicit** - avoid passing entire objects when only few fields are needed
- **Use TypeScript interfaces** for props
- **Handle loading and error states** in data components
- **Separate presentation from logic** - use controllers and hooks

### REUSABILITY CHECKLIST AND FEATURE MODULE PATTERN

#### **Before Creating a Component**
1. **Is it used in multiple places?** → Move to shared/components
2. **Is it feature-specific but reusable within the feature?** → Keep in feature/components
3. **Does it contain complex logic?** → Extract to hooks or Jotai atoms
4. **Is it purely presentational?** → Consider making a shared UI component

#### **Reusability Indicators**
- **UI patterns** (cards, forms, buttons) → shared/components
- **Business logic** (calculations, validations) → shared/utils or feature/helpers
- **Data fetching patterns** → shared/hooks
- **State management** (app-wide state) → shared/stores

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
- **Export only what's necessary** for other features or app
- **Keep internal implementation private**
- **Provide clear TypeScript types** for exported items
- **Document the public API** when complex

### DEVELOPMENT WORKFLOW

#### **When Building a New Feature**
1. **Start with the controller** - define data needs
2. **Create small components** - build UI piece by piece
3. **Extract logic to Jotai** when state becomes complex
4. **Identify reusable parts** and move to shared/
5. **Write tests** for reusable components and controllers
6. **Document the public API** in feature/index.ts

#### **Refactoring Guidelines**
- **When a component exceeds 150 lines** → Split into smaller components
- **When logic repeats** → Extract to shared utilities
- **When state management becomes complex** → Use Jotai atoms
- **When a component is used elsewhere** → Move to shared/

#### **Code Review Checklist**
- [ ] Components are focused and under 150 lines
- [ ] Controllers handle data flow correctly
- [ ] Jotai is used for complex state, not simple component state
- [ ] Reusable parts are identified and extracted
- [ ] TypeScript types are properly defined
- [ ] Tests cover critical paths

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

**Remember: Favor composition over complexity, and reusability over repetition.**

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

## Import and Development Patterns

### **Import Alias Strategy**
- **ALWAYS use `@/` alias** for internal imports
- Follow these patterns:
  - `@/components/ui/[component-name]` for UI components
  - `@/features/[feature-name]` for features
  - `@/shared/[category]` for utilities
- Use `type` keyword for TypeScript type imports

**Example**:
```typescript
// ✅ CORRECT
import { Button, ButtonGroup } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClientForm } from "@/features/clients";
import type { Client } from "@/shared/types";

// ❌ INCORRECT
import { Button } from "../../../components/ui/button";
import { Button } from "components/ui/button";
```

### **Testing Strategy**
- **Unit test shared components** individually
- **Integration test features** as complete flows
- **Test controllers** with mocked SDK responses
- **Test Jotai atoms** in isolation

## Special Development Reminders and Rules

### **Important Architectural Rules**
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
- **NEVER pass gymId or userId as parameters in controllers** - use RequestContext instead

### **Frontend Development Rules**
- Always read SDK documentation before implementing a query or mutation
- Always use the wrapper ui fields to implement a form
- Always look at the case studies before adding a new feature
- Don't use space property, use tailwind classes
- Don't use size property, use nativewind features instead
- **To build a feature**: First examine backend controller, then SDK method, finally mobile controller

### **Linting Strategy**
- Always run linting before committing code
- `not run lint`: This indicates a specific instruction to skip linting checks, which should be used sparingly and with caution

### **Development Workflows**
- **Use VSCode MCP to know about errors**

## Important Notes

- Never use relative imports - use absolute imports from 'src/'
- Always validate DTOs with class-validator decorators
- Use Prisma transactions for multi-step operations
- Cache keys should include gymId for proper isolation
- All file uploads go through centralized Assets module
- Swagger documentation auto-generated at /api/v1/docs

## UI Components Guide (Mobile App)

The mobile app uses Gluestack UI components located at `/packages/mobile/src/components/ui/`. These components provide a consistent design system:

### Available UI Components

#### **Layout and Structure**
- `box/` - Componente contenedor para layout
- `center/` - Componente wrapper para centrar
- `grid/` - Sistema de layout grid
- `hstack/` - Layout stack horizontal
- `vstack/` - Layout stack vertical
- `divider/` - Elemento separador visual

#### **Navegación e Interacción**
- `button/` - Botones de interacción primarios
- `fab/` - Botón de acción flotante
- `pressable/` - Componente wrapper táctil
- `link/` - Enlaces de navegación
- `menu/` - Sistema de menú dropdown

#### **Visualización de Datos**
- `card/` - Contenedor de contenido con estilo
- `text/` - Componente de tipografía
- `heading/` - Texto de título y encabezado
- `image/` - Componente de visualización de imagen
- `image-background/` - Wrapper de imagen de fondo
- `avatar/` - Imágenes de perfil de usuario
- `badge/` - Indicadores de estado
- `table/` - Visualización de tabla de datos

#### **Controles de Formulario**
- `input/` - Campos de entrada de texto
- `textarea/` - Entrada de texto multi-línea
- `checkbox/` - Checkboxes de selección
- `radio/` - Selección de botón radio
- `switch/` - Switches de toggle
- `select/` - Selección dropdown
- `slider/` - Entrada slider de rango
- `form-control/` - Wrapper de campo de formulario

#### **Feedback y Estado**
- `alert/` - Mensajes de notificación
- `toast/` - Notificaciones temporales
- `progress/` - Indicadores de progreso
- `spinner/` - Indicadores de carga
- `skeleton/` - Placeholders de carga

#### **Overlays y Modales**
- `modal/` - Diálogos modales
- `alert-dialog/` - Diálogos de confirmación
- `actionsheet/` - Acciones bottom sheet
- `drawer/` - Drawer de navegación lateral
- `popover/` - Popups contextuales
- `tooltip/` - Hints útiles
- `portal/` - Render a diferente ubicación DOM

#### **Listas y Datos**
- `flat-list/` - Renderizado optimizado de listas
- `section-list/` - Visualización de lista por secciones
- `virtualized-list/` - Listas optimizadas para rendimiento
- `scroll-view/` - Área de contenido scrolleable
- `refresh-control/` - Funcionalidad pull-to-refresh

#### **Utilidades de Layout**
- `accordion/` - Secciones de contenido plegables
- `safe-area-view/` - Manejo de safe area
- `keyboard-avoiding-view/` - Layouts conscientes del teclado
- `input-accessory-view/` - Accesorios de input
- `status-bar/` - Configuración de status bar
- `view/` - Contenedor view básico

#### **Sistema y Provider**
- `gluestack-ui-provider/` - Provider de tema y configuración
- `utils/` - Funciones utilitarias y helpers

### Ejemplos de Uso

```typescript
// ✅ Componentes de Layout
import { VStack, HStack, Box } from "@/components/ui/vstack";
import { Card, CardContent } from "@/components/ui/card";

// ✅ Componentes de Formulario
import { Input, InputField } from "@/components/ui/input";
import { Button, ButtonText } from "@/components/ui/button";
import { FormControl, FormControlLabel } from "@/components/ui/form-control";

// ✅ Componentes de Feedback
import { Alert, AlertText } from "@/components/ui/alert";
import { Toast, ToastTitle } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
```

### Component Guidelines

- Always use Gluestack UI components instead of custom implementations
- Follow component hierarchy (e.g., InputField inside Input)
- Use VStack/HStack for layouts instead of direct flexbox
- Implement proper spacing using Box component with padding/margin
