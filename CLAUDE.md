# CLAUDE.md

[Previous content remains unchanged]

## Development Paths

### Form Development
- Always use `/Users/leobar37/code/gymspace/packages/mobile/src/components/forms` to work with forms

### Component Replacements
- CardContent component does not exist, use View with tailwind classes instead

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
- Each feature should have proper routes in app/[feature]/ directory
- Required routes for CRUD operations:
  - `_layout.tsx` - Stack navigator layout
  - `index.tsx` - List view
  - `create.tsx` - Create new item
  - `[id].tsx` - View item details
  - `[id]/edit.tsx` - Edit existing item
- Use router.push() for navigation, not Redirect components

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