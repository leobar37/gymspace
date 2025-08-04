# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GymSpace Mobile is a React Native application built with Expo, featuring:
- **NativeWind** (v4) for TailwindCSS styling
- **GlueStack UI** as the component library  
- **Expo Router** for file-based navigation
- **TanStack Query** for server state management
- **Jotai** for client state management
- **React Hook Form** with Zod validation

## Development Commands

```bash
# Install dependencies (always use pnpm)
pnpm install

# Start development server
pnpm start

# Platform-specific development
pnpm android  # Start on Android with dark mode
pnpm ios      # Start on iOS with dark mode
pnpm web      # Start on web with dark mode
```

## Architecture Overview

### Import Pattern
Always use absolute imports with `@/` alias:
```typescript
import { Button } from "@/components/ui/button";
import { ClientForm } from "@/features/clients";
import type { Client } from "@/shared/types";
```

### Project Structure
```
src/
├── app/                    # Expo Router screens
│   ├── (app)/             # Authenticated app routes
│   ├── (onboarding)/      # Onboarding flow
│   └── _layout.tsx        # Root layout with providers
├── components/
│   ├── ui/                # GlueStack UI components
│   └── forms/             # Form wrapper components
├── controllers/           # TanStack Query + SDK integration
├── providers/             # App-level providers
├── features/              # Feature modules (when implemented)
├── shared/               # Shared utilities and types
└── lib/                  # Configuration files
```

### Key Architectural Patterns

1. **Controllers Pattern**: Bridge between SDK and TanStack Query
   - One controller per domain entity
   - Handles data fetching, mutations, and cache management
   - Returns custom hooks with loading states and errors

2. **Form Components**: Wrapper components around GlueStack UI
   - Integrate with React Hook Form
   - Located in `src/components/forms/`
   - Follow pattern: `Form[ComponentName].tsx`

3. **State Management**:
   - **Server State**: TanStack Query with controllers
   - **Client State**: Jotai atoms (when complex state needed)
   - **Form State**: React Hook Form with Zod validation

4. **Styling**: 
   - Use NativeWind classes directly
   - No `space` or `size` props - use Tailwind classes
   - GlueStack UI components configured via `gluestack-ui.config.json`

### Provider Hierarchy

The app uses multiple providers wrapped in `AppProviders`:
1. GluestackUIProvider (theme)
2. QueryClientProvider (TanStack Query)
3. JotaiProvider (state management)
4. GymSdkProvider (SDK instance)

### TanStack Query Configuration

Default query options:
- `staleTime`: 2 minutes
- `gcTime`: 10 minutes (garbage collection)
- `retry`: 1 attempt with exponential backoff
- `refetchOnWindowFocus`: false
- `refetchOnReconnect`: 'always'

## Important Development Notes

1. **Always use pnpm** for package management
2. **Check SDK documentation** before implementing queries/mutations
3. **Use form wrapper components** (FormInput, FormSelect, etc.) for forms
4. **Review use cases** in docs before adding features
5. **Use Tailwind classes** instead of space/size properties
6. **Follow absolute import pattern** with @/ alias
7. **GlueStack UI components** are pre-configured in `src/components/ui/`

## Monorepo Integration

This package is part of a pnpm workspace. Metro is configured to:
- Watch files across the monorepo
- Resolve @gymspace/* packages correctly
- Support hot reloading across packages

## Current Implementation Status

- ✅ Basic app structure with navigation
- ✅ Provider setup (Query, Jotai, GlueStack)
- ✅ Form component wrappers
- ✅ Auth controller pattern established
- 🚧 Feature modules to be implemented
- 🚧 SDK integration pending