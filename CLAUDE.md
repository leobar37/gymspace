# CLAUDE.md

[Previous content remains unchanged]

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

### Service Architecture
- Add the context as first parameter in the services, and pass the complete RequestContext, instead of 

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
- use tailwind for styling
- never add styles to the button, use the default styles of the library and its variants
- always pass the complete RequestContext to the services
- nevear addd examples unless i ask for it
- not add README.md after do something
- the primary color is the default of the library
- never run commands unless i ask for it