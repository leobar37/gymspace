# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Quickstart Commands

### Install and Start Everything

```bash
# Install dependencies
pnpm install

# Start all services (API + Mobile + Landing)
pnpm dev

# Start Docker services (PostgreSQL + Redis + MinIO)
pnpm dev:docker
```

### Focused Development

```bash
# Start only API backend
pnpm dev:api

# Start only mobile app
pnpm dev:mobile

# Start only landing page
pnpm dev:landing
```

### Common Tasks

```bash
# Build all packages
pnpm build

# Run tests across all packages
pnpm test

# Lint and format code
pnpm lint
pnpm format

# Generate API client from OpenAPI
pnpm generate:api
```

## Monorepo Architecture Cheat-Sheet

```
gymspace/
├── packages/
│   ├── api/         # NestJS Backend (Fastify + Prisma + PostgreSQL)
│   ├── mobile/      # React Native/Expo Mobile App
│   ├── landing/     # Next.js Landing Page
│   ├── sdk/         # TypeScript SDK for API consumption
│   └── shared/      # Shared types and interfaces
├── docker/          # PostgreSQL + Redis + MinIO containers
├── docs/            # Architecture and implementation guides
└── mcp/             # Gluestack UI components MCP server
```

**Tech Stack:**

- Backend: NestJS + Fastify + PostgreSQL + Prisma + Redis + S3/MinIO
- Mobile: Expo + React Native + Gluestack UI + Zustand + TanStack Query
- SDK: TypeScript + Axios + Zod validation
- Package Management: pnpm workspaces

## Infrastructure & Database Setup

### Start Development Services

```bash
# Start PostgreSQL (5434), Redis (6380), MinIO (9002-9003)
pnpm dev:docker

# Stop and remove containers
docker compose -f docker/docker-compose.yml down -v
```

### Database Operations

```bash
# Navigate to API package
cd packages/api

# Run migrations
pnpm prisma:migrate

# Generate Prisma client
pnpm prisma:generate

# Seed database
pnpm prisma:seed

# Reset database (destructive)
pnpm prisma:reset

# Open Prisma Studio
pnpm prisma:studio
```

### Health Checks

```bash
# Test PostgreSQL connection
psql -h localhost -p 5434 -U gymspace -d gymspace_dev

# Test Redis connection
redis-cli -p 6380 ping

# MinIO console: http://localhost:9003 (gymspace:gymspace123)
```

## Package Workflows

### API Package (`packages/api`)

```bash
cd packages/api

# Development with watch mode
pnpm dev

# Run API tests
pnpm test
pnpm test:watch
pnpm test:cov

# Debug mode
pnpm start:debug

# CLI commands
pnpm cli setup-user
```

### Mobile Package (`packages/mobile`)

```bash
cd packages/mobile

# Start Expo development server
pnpm start

# Run on Android/iOS with dark mode
pnpm android
pnpm ios

# Environment setup (required)
cp .env.example .env
# Edit .env with your machine's IP for API_URL
```

### SDK Package (`packages/sdk`)

```bash
cd packages/sdk

# Build SDK
pnpm build

# Watch mode for development
pnpm dev

# Run SDK tests with UI
pnpm test:ui
pnpm test:coverage
```

### Shared Package (`packages/shared`)

```bash
cd packages/shared

# Build shared types
pnpm build

# Type checking
pnpm typecheck
```

## Development Patterns & Constraints

### Backend Architecture Rules

- **Exception-First**: Services throw exceptions, never return errors
- **Context-Aware**: Always pass complete `RequestContext` to services
- **Service Parameter Order**: Add the context as first parameter in the services, and pass the complete RequestContext
- **Permission-Based**: Use `@Allow()` decorator with permission constants
- **Gym-Scoped**: All data access is scoped to current gym context
- **Soft Delete**: Use `deleted_at` instead of physical deletion

### Mobile Development Best Practices

- **Project Structure**: Follow the established directory structure for consistency
- **Language**: Always respond in English
- **Code Style**: Use the established coding patterns and conventions
- **Component Replacement**: CardContent component does not exist, use View with tailwind classes instead

### Form Development Best Practices

- **Form Components**: ALWAYS use components from `/packages/mobile/src/components/forms` directory
- **State Management**: ALWAYS use react-hook-form with FormProvider for form state management
- **NEVER**: NEVER use useState for form fields - use react-hook-form instead
- **Validation**: Use zodResolver for form validation with zod schemas
- **Input Components**: Always use FormInput, FormTextarea, FormSwitch components from forms directory
- **Component Props**: Form components should receive name prop and work with react-hook-form

### UI Components Best Practices

- **Button Styling**: NEVER add custom color styles to buttons (no bg-blue-600, text-white, etc.)
- **Button Variants**: ALWAYS use Button component variants: variant="solid" for primary, variant="outline" for secondary
- **Design System**: Let the design system handle all button colors and styles
- **Component Wrappers**: Use proper component wrappers from the UI library
- **Icons in Buttons**: Icons in buttons should not have color classes when using solid variant
- **Primary Color**: The primary color is the default of the library

### State Management & Data Fetching

- **Global State**: Use zustand for complex state management that needs to be shared across components
- **Store Organization**: Create stores in `features/[feature]/stores/` directory
- **Server State**: Use TanStack Query mutations for server state updates
- **Optimistic Updates**: Integrate zustand with TanStack Query for optimistic updates

### Routing & File Structure

- **Feature Organization**: Each feature should have proper routes in app/[feature]/ directory
- **Required Routes**: Required routes for CRUD operations:
  - `_layout.tsx` - Stack navigator layout
  - `index.tsx` - List view
  - `create.tsx` - Create new item
  - `[id].tsx` - View item details
  - `[id]/edit.tsx` - Edit existing item
- **Navigation**: Use router.push() for navigation, not Redirect components
- **File Structure Conventions**:
  - Mobile forms: `packages/mobile/src/components/forms/`
  - Mobile features: `packages/mobile/src/features/[feature]/`
  - API modules: `packages/api/src/modules/[module]/`
  - Shared types: `packages/shared/src/`

## Architectural Concepts

### RequestContext System

Central context object injected via decorator that provides:

- User information from Supabase Auth
- Current gym context from header
- Computed permissions for current context
- Cache layer integration

### Permission System

- Declarative permissions with `@Allow([PERMISSION_CONSTANT])` decorator
- Role-based access control with database-stored permissions
- Context-aware permission checking within gym scope

### Exception-First Policy

- Services only throw exceptions, never return error objects
- Global exception filter transforms exceptions to HTTP responses
- Standardized error handling across the entire API

## Mobile Development Tips

### Environment Configuration

```bash
# Mobile app requires API_URL in .env
# Use your machine's IP address for local development
API_URL=http://192.168.100.18:5200/api/v1

# For production builds
API_URL=https://api.yourapp.com/api/v1
```

### Common Expo Commands

```bash
# Clear cache and restart
npx expo start --clear

# Check project health
npx expo doctor

# Build for production
eas build --profile production
```

### Dark Mode Configuration

Mobile app uses `DARK_MODE=media` environment variable for theme detection.

### Package Overrides

- NativeWind is pinned to version 4.1.23 in pnpm overrides
- Zod is managed through pnpm catalog for consistency

## Testing Strategy

### Running Tests

```bash
# All packages
pnpm test

# Specific package
pnpm --filter @gymspace/api run test
pnpm --filter @gymspace/sdk run test:coverage

# API integration tests
cd packages/api && pnpm test:e2e
```

### Test File Patterns

- API: `*.spec.ts` files in `src/` directories
- SDK: Vitest with coverage reporting
- Mobile: React Native testing patterns

## MCP Integration

This project includes a custom MCP server for Gluestack UI components:

```bash
# Start MCP server
pnpm mcp:start

# Test MCP integration
pnpm mcp:test
```

The MCP server provides Gluestack UI component integration for Claude Desktop and Cursor IDE.

## Troubleshooting

### Common Issues

- **Mobile app can't connect to API**: Check `API_URL` in `.env` uses your machine's IP
- **Database connection errors**: Ensure `pnpm dev:docker` is running
- **Package linking issues**: Run `pnpm install` at root to fix workspace references
- **Build failures**: Check for TypeScript errors with `pnpm typecheck`

### Service Ports

- API: http://localhost:5200
- PostgreSQL: localhost:5434
- Redis: localhost:6380
- MinIO API: localhost:9002
- MinIO Console: http://localhost:9003

For detailed architectural information, see `docs/backend-architecture.md` and other documentation files.
