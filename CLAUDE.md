# CLAUDE.md

## Serena Tools & Memory Usage (CRITICAL)

### Memory System
- **ALWAYS** search `.serena/memories/` for existing patterns before implementing
- **CHECK** for documented solutions: `ls .serena/memories/*.md`
- **USE** memories to maintain consistency across the codebase
- **CREATE** new memories after implementing reusable patterns
- **UPDATE** memories when patterns evolve or improve

### Serena Tools Priority
When available, use these tools for better code understanding:
- `mcp__serena__find_file` - Locate files quickly by name patterns
- `mcp__serena__search_for_pattern` - Find code patterns across codebase
- `mcp__serena__find_symbol` - Locate function/class definitions
- `mcp__serena__find_referencing_symbols` - Find where symbols are used

### Memory-First Workflow
1. **Before implementing**: Search memories for similar patterns
   ```bash
   ls .serena/memories/ | grep -i "pattern-name"
   ```
2. **During development**: Reference existing memories for consistency
3. **After success**: Document new patterns in `.serena/memories/`
4. **Pattern format**: `feature-pattern-description.md`

### Key Memories to Check
- `react-native-infinite-scroll-pattern.md` - Infinite scroll with TanStack Query
- Check for form patterns, navigation patterns, state management patterns
- Look for component patterns before creating new ones

### Infinite Scroll Implementation (CRITICAL)
- **NEVER** use custom pagination hooks (`usePagination`, `useInfiniteScroll`)
- **ALWAYS** use TanStack Query's `useInfiniteQuery` directly
- **USE** native `FlatList` from React Native, not custom wrappers
- **REFERENCE** `.serena/memories/react-native-infinite-scroll-pattern.md` for implementation
- Key pattern:
  ```typescript
  const { data, fetchNextPage, hasNextPage, refetch } = useInfiniteQuery({
    queryKey: ['resource', filters],
    queryFn: ({ pageParam = 1 }) => sdk.resource.get({ page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.meta.hasNext ? lastPage.meta.page + 1 : undefined
  });
  const items = useMemo(() => data?.pages.flatMap(page => page.data) ?? [], [data]);
  ```

## Development Paths

### Type Management (CRITICAL for Mobile App)
- **ALWAYS** use SDK types directly in controllers, don't duplicate type definitions
- **NEVER** create local types that mirror SDK DTOs
- Pattern for controllers:
  ```typescript
  import { CreateContractDto, RenewContractDto } from '@gymspace/sdk';
  export type ContractFormData = CreateContractDto;
  ```
- This ensures all fields from SDK are properly included in requests
- Prevents issues like missing paymentMethodId or other required fields

## Development Paths

### SDK Access Pattern (CRITICAL for Mobile App)
- **NEVER** import gymspaceClient directly from lib/api-client
- **ALWAYS** use useGymSdk hook from @/providers/GymSdkProvider
- Pattern: `const { sdk } = useGymSdk();`
- This ensures proper authentication and configuration
- All API calls in mobile app must go through the sdk from useGymSdk

### Loading Screen Pattern (CRITICAL for Mobile App)
- **ALWAYS** use `useLoadingScreen` from `@/shared/loading-screen` for:
  - Create operations (new records)
  - Update/Edit operations
  - Delete operations
  - Complex async operations
- Pattern: `const { execute } = useLoadingScreen();`
- Wrap async operations with `execute()` providing:
  - `action`: Loading message
  - `successMessage`: Success feedback
  - `successActions`: Post-success navigation options
  - `errorFormatter`: Error message formatting
- **NEVER** use simple try/catch with toast for these operations

### Form Development
- Always use `/Users/leobar37/code/gymspace/packages/mobile/src/components/forms` to work with forms

### Component Replacements
- CardContent component does not exist, use View with tailwind classes instead

### Configuration Context (CRITICAL for Mobile App)
- **NEVER** use `useGymContext` or `useGymConfig` - they don't exist
- Available hooks from `@/config/ConfigContext`:
  - `useConfig()` - Returns full config context
  - `useCountryConfig()` - Returns country configuration
  - `useDocumentTypes()` - Returns document types for the country
  - `useDocumentValidator()` - Returns document validation function
  - `useFormatPrice()` - Returns price formatting function
- Pattern for country config: `const config = useCountryConfig();`
- Pattern for price formatting: `const formatPrice = useFormatPrice();`

### Service Architecture (CRITICAL for Backend)
- **ALWAYS** pass the complete RequestContext/IRequestContext as the first parameter in ALL service methods
- **NEVER** pass just gymId, userId, or any other individual parameter instead of context
- Pattern: `async methodName(context: IRequestContext, ...otherParams): Promise<ReturnType>`
- The context contains gymId, userId, permissions, organization, and other critical information
- Example: `validateClientBelongsToGym(context: IRequestContext, clientId: string)` ✅
- Wrong: `validateClientBelongsToGym(gymId: string, clientId: string)` ❌

## State Management
- Use zustand for complex state management that needs to be shared across components
- Create stores in `features/[feature]/stores/` directory
- Use TanStack Query mutations for server state updates
- Integrate zustand with TanStack Query for optimistic updates

## UI Components Best Practices
- NEVER add custom color styles to buttons (no bg-blue-600, text-white, etc.)
- ALWAYS use Button component variants: variant="solid" for primary, variant="outline" for secondary
- Let the design system handle all button colors and styles
- Use proper component wrappers from the UI library
- Icons in buttons should not have color classes when using solid variant

### Button Component Variants
- `variant="solid"` - Primary actions with full background color
- `variant="outline"` - Secondary actions with border only
- `variant="link"` - Text-only actions with underline on hover
- `variant="unstyled"` - Completely removes all default styles for custom styling
  - Removes: background, padding, height, border radius, hover states, focus rings, font weight
  - Use when you need full control over button appearance
  - Example: `<Button variant="unstyled" className="custom-styles">`

## Form Development Best Practices
- ALWAYS use react-hook-form with FormProvider for form state management
- NEVER use useState for form fields - use react-hook-form instead
- Use zodResolver for form validation with zod schemas
- Always use FormInput, FormTextarea, FormSwitch components from forms directory
- Form components should receive name prop and work with react-hook-form

## Routing Structure

### Main App Structure
- `/_layout.tsx` - Root app layout with providers, gesture handler, and safe area
- `/index.tsx` - App entry point with auth redirects

### Authentication & Onboarding Routes
**Base:** `/(onboarding)/`
- `_layout.tsx` - Onboarding layout with auth checks and redirects
- `index.tsx` - Onboarding landing page
- `login.tsx` - User login screen

**Owner Onboarding:** `/(onboarding)/owner/`
- `_layout.tsx` - Owner onboarding stack layout
- `welcome.tsx` - Welcome screen for gym owners
- `step-1-personal.tsx` - Personal information collection
- `step-2-contact.tsx` - Contact details form
- `step-3-security.tsx` - Password and security setup
- `email-verification.tsx` - Email verification process
- `organization-setup.tsx` - Organization configuration
- `create-gym.tsx` - Gym creation and setup

**Collaborator Onboarding:** `/(onboarding)/collaborator/`
- `_layout.tsx` - Collaborator onboarding stack layout
- `invitation.tsx` - Accept invitation to gym
- `complete-registration.tsx` - Complete collaborator registration

**Password Reset:** `/(onboarding)/password-reset/`
- `_layout.tsx` - Password reset flow layout
- `request.tsx` - Request password reset via email
- `verify.tsx` - Verify reset code from email
- `reset.tsx` - Set new password form

### Main Application (Authenticated Users)
**Base:** `/(app)/` - Tab-based navigation
- `_layout.tsx` - Main app layout with bottom tabs (Inicio, Clientes, Inventario, Contratos, Más)
- `index.tsx` - Dashboard with gym overview and stats
- `clients.tsx` - Clients management tab overview
- `inventory.tsx` - Inventory and sales tab overview
- `contracts.tsx` - Contracts management tab overview
- `more.tsx` - Additional options and settings tab

### Feature Module Routes

**Clients Management:** `/clients/`
- `_layout.tsx` - Clients stack navigation
- `create.tsx` - Create new client form
- `[id].tsx` - View client details and information
- `[id]/edit.tsx` - Edit existing client data

**Plans Management:** `/plans/`
- `_layout.tsx` - Plans stack navigation
- `index.tsx` - List all available plans
- `create.tsx` - Create new membership plan
- `[id].tsx` - View plan details and pricing
- `[id]/edit.tsx` - Edit plan information and pricing

**Contracts Management:** `/contracts/`
- `_layout.tsx` - Contracts stack navigation
- `create.tsx` - Create new client contract
- `[id].tsx` - View contract details and status
- `[id]/edit.tsx` - Edit contract terms and details
- `[id]/renew.tsx` - Renew existing contract
- `expiring.tsx` - View contracts nearing expiration

**Inventory Management:** `/inventory/`
- `_layout.tsx` - Inventory stack navigation
- `products.tsx` - List all products in inventory
- `products/new.tsx` - Add new product to inventory
- `products/[id].tsx` - View product details and stock levels
- `categories.tsx` - Manage product categories
- `categories/new.tsx` - Create new product category
- `categories/[id]/edit.tsx` - Edit category information
- `new-sale.tsx` - Process new product sale
- `sales/[id].tsx` - View individual sale details
- `sales-history.tsx` - Complete sales transaction history
- `low-stock.tsx` - View products with low stock alerts
- `reports.tsx` - Inventory analytics and reports

**Suppliers Management:** `/suppliers/`
- `_layout.tsx` - Suppliers stack navigation
- `index.tsx` - List all registered suppliers
- `create.tsx` - Add new supplier to system
- `[id].tsx` - View supplier details and contact info
- `[id]/edit.tsx` - Edit supplier information

**Profile Management:** `/profile/`
- `_layout.tsx` - Profile stack navigation
- `edit.tsx` - Edit user profile information
- `change-password.tsx` - Change account password

**Gym Settings:** `/gym/`
- `_layout.tsx` - Gym settings stack navigation
- `settings.tsx` - Configure gym preferences and settings

### Navigation Patterns
- Use `router.push()` for programmatic navigation
- Avoid `Redirect` components for user-initiated navigation
- Tab navigation for main app sections
- Stack navigation within feature modules
- Authentication redirects handled in layout components

## Preferences
- always respond in english
- use zustand to handle complicated state management
- use TanStack Query for data fetching and caching
- use tailwind/nativewind for styling
- never add styles to the button, use the default styles of the library and its variants
- always pass the complete RequestContext to the services
- never add examples unless i ask for it
- not add README.md after do something
- the primary color is the default of the library
- never run commands unless i ask for it
- not run lints commands
- user serena when it is available
- use serena tools to work better
- not add comments unless i ask for it

## React Native Mobile Expert Agent

### Activation Conditions
This specialized agent activates when:
- Implementing or designing mobile app components or interfaces
- Working with React Native Expo and @gluestack-ui components
- Creating screens, navigation patterns, or mobile-specific features
- Keywords: "mobile screen", "app component", "react native", "expo", "gluestack", "mobile UI", "mobile form"
- Working within the `packages/mobile` directory

### Core Expertise
- **Framework**: React Native with Expo SDK 51
- **UI Library**: @gluestack-ui/themed components
- **Navigation**: Expo Router for file-based routing
- **State Management**: Zustand stores and TanStack Query
- **Forms**: React Hook Form with Zod validation

### Component Resources

#### UI Components Location
**Base Path**: `packages/mobile/src/components/ui/`

Available UI components that MUST be used:
- `ActionSheet`: Bottom sheet actions and menus
- `Alert`: Alert dialogs and confirmations
- `Button`: Primary interactive element with variants
- `Card`: Content containers with consistent styling
- `Checkbox`: Selection controls for forms
- `Input`: Text input fields with validation support
- `Modal`: Overlay dialogs and popups
- `Select`: Dropdown selection components
- `Switch`: Toggle switches for boolean values
- `Text`: Typography component with variants
- `Toast`: Notification messages and feedback
- `Badge`: Status indicators and labels
- `Avatar`: User profile images and placeholders
- `Progress`: Loading and progress indicators
- `Spinner`: Loading spinners and activity indicators

#### Form Components (CRITICAL)
**Base Path**: `packages/mobile/src/components/forms/`

ALWAYS use these form components when creating forms:
- `FormInput`: Text input with react-hook-form integration
- `FormTextarea`: Multi-line text input with validation
- `FormSwitch`: Toggle switches for form boolean fields
- `FormSelect`: Dropdown select with form integration
- `FormDatePicker`: Date selection with validation
- `FormCheckbox`: Checkbox with form state management
- `FormProvider`: Context provider for form state
- `FormField`: Field wrapper with error handling

### Development Guidelines

#### Import Patterns
```typescript
// UI Components
import { Button, Text, Card } from '@/components/ui';

// Form Components
import { FormInput, FormProvider } from '@/components/forms';

// Hooks
import { useGymSdk } from '@/providers/GymSdkProvider';
import { useLoadingScreen } from '@/shared/loading-screen';
import { useCountryConfig, useFormatPrice } from '@/config/ConfigContext';

// SDK Types
import { CreateClientDto, UpdateClientDto } from '@gymspace/sdk';
```

#### Best Practices
1. **Component Selection**: Always use components from `@/components/ui/` for UI elements
2. **Form Creation**: Always use components from `@/components/forms/` for form fields
3. **API Calls**: Always use `const { sdk } = useGymSdk()` for API operations
4. **Loading States**: Always wrap async operations with `useLoadingScreen().execute()`
5. **Type Safety**: Always import and use SDK types directly, never duplicate them
6. **Styling**: Use tailwind classes with NativeWind, never inline styles
7. **Navigation**: Use `router.push()` from expo-router for navigation
8. **Validation**: Use Zod schemas with react-hook-form for form validation

#### Common Patterns

**Screen Component Structure**:
```typescript
export default function ScreenName() {
  const { sdk } = useGymSdk();
  const { execute } = useLoadingScreen();
  const router = useRouter();

  // Form setup with react-hook-form
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // API operations wrapped in loading screen
  const handleSubmit = form.handleSubmit(async (data) => {
    await execute({
      action: 'Creating...',
      fn: async () => {
        await sdk.resource.create(data);
        router.push('/success');
      },
      successMessage: 'Created successfully',
    });
  });

  return (
    <FormProvider {...form}>
      {/* Screen content */}
    </FormProvider>
  );
}
```

**Form Field Pattern**:
```typescript
<FormInput
  name="fieldName"
  label="Field Label"
  placeholder="Enter value"
  keyboardType="default"
/>
```

#### Gluestack-UI Component Usage

**Button Variants**:
- `variant="solid"` - Primary actions
- `variant="outline"` - Secondary actions
- `variant="ghost"` - Tertiary actions
- `variant="link"` - Text-only actions

**Modal Pattern**:
```typescript
<Modal isOpen={isOpen} onClose={onClose}>
  <Modal.Backdrop />
  <Modal.Content>
    <Modal.Header>
      <Text>Title</Text>
      <Modal.CloseButton />
    </Modal.Header>
    <Modal.Body>
      {/* Content */}
    </Modal.Body>
    <Modal.Footer>
      <Button onPress={onClose}>Close</Button>
    </Modal.Footer>
  </Modal.Content>
</Modal>
```

**ActionSheet Pattern**:
```typescript
<ActionSheet isOpen={isOpen} onClose={onClose}>
  <ActionSheet.Backdrop />
  <ActionSheet.Content>
    <ActionSheet.DragIndicator />
    <ActionSheet.Item onPress={handleAction}>
      <ActionSheet.ItemText>Option</ActionSheet.ItemText>
    </ActionSheet.Item>
  </ActionSheet.Content>
</ActionSheet>
```

#### Mobile-Specific Considerations
1. **Keyboard Handling**: Use KeyboardAvoidingView for forms
2. **Safe Areas**: Use SafeAreaView or useSafeAreaInsets
3. **Gesture Handling**: Leverage react-native-gesture-handler
4. **Performance**: Use FlashList for large lists
5. **Accessibility**: Add proper accessibility props to all interactive elements
6. **Platform Differences**: Handle iOS/Android differences when necessary

### Agent Tools and Capabilities
When this agent is active, it will:
- Automatically use the correct UI components from the component library
- Generate forms using the proper form components
- Implement proper loading states and error handling
- Follow established mobile app patterns and conventions
- Ensure type safety with SDK types
- Create responsive and accessible mobile interfaces