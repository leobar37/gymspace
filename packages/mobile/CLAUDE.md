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
- ✅ Client management system (full CRUD)
- ✅ SDK integration complete
- 🚧 Other feature modules to be implemented

## UI Standardization Memory

### UI Consistency Guidelines

**Rules to enforce**:
1. Add SafeArea and SafeKeyboard to all screens
2. Use ScrollView for all forms
3. Add proper information separators/dividers

**Tasks**:
- Audit all screens and ensure SafeArea + SafeKeyboard implementation
- Wrap form content in ScrollView components
- Add consistent visual separators between information sections

**Goal**: Consistent, keyboard-safe, scrollable UI across the entire app.

## CRUD Development Strategy & Common Pitfalls

### Critical SDK Integration Rules

**⚠️ ALWAYS VERIFY SDK METHOD NAMES FIRST**
- Never assume SDK method names match API endpoints
- Check actual method names in `/packages/sdk/src/resources/[resource].ts`
- Common mistakes:
  ```typescript
  // ❌ WRONG - These don't exist
  sdk.clients.search()
  sdk.clients.getById()
  sdk.clients.create()
  
  // ✅ CORRECT - Actual SDK methods
  sdk.clients.searchClients()
  sdk.clients.getClient()
  sdk.clients.createClient()
  ```

**⚠️ UNDERSTAND RESPONSE STRUCTURES**
- SDK methods return data directly, not wrapped in `.data` property
- Paginated responses use `PaginatedResponseDto<T>` structure
- Common mistakes:
  ```typescript
  // ❌ WRONG - SDK returns data directly
  const response = await sdk.clients.getClient(id);
  return response.data; // This will be undefined
  
  // ✅ CORRECT - Use response directly
  const response = await sdk.clients.getClient(id);
  return response; // Direct data return
  
  // ✅ FOR LISTS - Use .data for paginated results
  const listResponse = await sdk.clients.searchClients(params);
  return listResponse; // Contains { data: Client[], meta: PaginationMeta }
  ```

**⚠️ FIELD NAME CONSISTENCY**
- Always check SDK model interfaces for exact field names
- Common mistakes:
  ```typescript
  // ❌ WRONG - API uses boolean field
  client.status === 'active'
  
  // ✅ CORRECT - Use actual boolean field
  client.isActive
  ```

### Controller Implementation Patterns

**Query Keys Strategy**
```typescript
// ✅ ALWAYS use hierarchical query keys
export const [resource]Keys = {
  all: ['[resource]'] as const,
  lists: () => [...[resource]Keys.all, 'list'] as const,
  list: (filters: any) => [...[resource]Keys.lists(), { filters }] as const,
  details: () => [...[resource]Keys.all, 'detail'] as const,
  detail: (id: string) => [...[resource]Keys.details(), id] as const,
};
```

**Cache Invalidation Strategy**
```typescript
// ✅ ALWAYS invalidate appropriate caches
onSuccess: (data, variables) => {
  // Update specific item cache
  queryClient.setQueryData([resource]Keys.detail(variables.id), data);
  // Invalidate list to show updated data
  queryClient.invalidateQueries({ queryKey: [resource]Keys.lists() });
}
```

**Data Transformation**
```typescript
// ✅ Transform form data to match SDK expectations
const createMutation = useMutation({
  mutationFn: async (formData: FormData) => {
    const apiData = {
      // Map form fields to API fields
      name: formData.name,
      email: formData.email || '', // Handle optional fields
      document: formData.document || formData.documentId, // Legacy support
      address: formData.address || '', // Required by API
    };
    return await sdk.[resource].create[Resource](apiData);
  },
});
```

### Form Implementation Rules

**Required Fields Validation**
```typescript
// ✅ ALWAYS match API requirements exactly
const schema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  address: z.string().min(1, 'Dirección requerida'), // Match API requirement
  phone: z.string().optional().or(z.literal('')), // Make truly optional
});
```

**Form Reusability**
```typescript
// ✅ Design forms for both create and edit modes
export const Create[Resource]Form: React.FC<{
  initialData?: Partial<FormData>;
  isEditing?: boolean;
  [resource]Id?: string;
}> = ({ initialData, isEditing, [resource]Id }) => {
  const onSubmit = async (data: FormSchema) => {
    if (isEditing && [resource]Id) {
      update[Resource]({ id: [resource]Id, data });
    } else {
      create[Resource](data);
    }
  };
};
```

### UI Component Patterns

**List Component Structure**
```typescript
// ✅ Handle paginated response structure correctly
<FlatList
  data={data?.data || []} // For paginated responses
  // OR
  data={data || []} // For direct array responses
/>

// ✅ Check data structure for conditional rendering
{data?.data && data.data.length > 0 && ( // For paginated
  <FAB onPress={handleAdd} />
)}
```

**Status Display Consistency**
```typescript
// ✅ Use boolean fields correctly
<Badge action={item.isActive ? 'success' : 'muted'}>
  <BadgeText>{item.isActive ? 'Activo' : 'Inactivo'}</BadgeText>
</Badge>

// ✅ Action text based on current state
<ActionsheetItemText>
  {selectedItem?.isActive ? 'Desactivar' : 'Activar'}
</ActionsheetItemText>
```

### Navigation & UX Patterns

**Standard CRUD Navigation Flow**
```
List View (/[resource])
├── Tap Item → Details (/[resource]/[id])
│   ├── Header Action → ActionSheet
│   │   ├── Edit → Edit Form (/[resource]/[id]/edit)
│   │   └── Toggle Status → Confirmation Dialog
│   └── Status Button → Direct Toggle
├── Search → Debounced Filter
└── FAB → Create Form (/[resource]/create)
```

**Action Confirmation Pattern**
```typescript
// ✅ Always confirm destructive actions
const handle[Action]Press = () => {
  setSelectedItem(item);
  setShowConfirmation(true);
};

const handleConfirm[Action] = () => {
  [action](selectedItem.id);
  setShowConfirmation(false);
};
```

### Development Workflow Checklist

**Before Starting Implementation:**
- [ ] Review OpenAPI spec for available endpoints
- [ ] Verify SDK methods exist and match API
- [ ] Check SDK model interfaces for field names and types
- [ ] Identify required vs optional fields

**During Implementation:**
- [ ] Use correct SDK method names
- [ ] Handle response structures properly
- [ ] Implement proper cache invalidation
- [ ] Add data transformation where needed
- [ ] Use correct field names in UI components

**After Implementation:**
- [ ] Test all CRUD operations
- [ ] Verify loading states work
- [ ] Test error handling
- [ ] Confirm cache updates correctly
- [ ] Validate form submission works for both create/edit

### Reference Implementation

See complete CRUD implementation example in:
- Controller: `src/features/clients/controllers/clients.controller.ts`
- List UI: `src/features/clients/components/ClientsList.tsx`
- Form: `src/features/clients/components/CreateClientForm.tsx`
- Details: `src/app/clients/[id].tsx`
- Edit: `src/app/clients/[id]/edit.tsx`

For detailed strategy, see: `/docs/crud-development-strategy.md`