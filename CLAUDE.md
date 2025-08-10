# CLAUDE.md

[Previous content remains unchanged]

## Development Paths

### Form Development
- Always use `/Users/leobar37/code/gymspace/packages/mobile/src/components/forms` to work with forms

### Component Replacements
- CardContent component does not exist, use View with tailwind classes instead

### Service Architecture
- Add the context as first parameter in the services, and pass the complete RequestContext, instead of 

## Preferences
- always respond in english
- use zustand to handle complicated state management
- use TanStack Query for data fetching and caching
- use tailwind for styling
- never add styles to the button, use the default styles of the library and its variants

- always pass the complete RequestContext to the services