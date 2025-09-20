# CLAUDE.md

## Priority Instructions

### Information Sources
- **Context7**: Use for current documentation and libraries
- **Web Search**: Use for errors, bugs, and troubleshooting
- **Serena**: Use `@serena-tools-workflow` memory for tool usage

### Code Quality
- **NativeWind**: Priority for styling (Tailwind CSS for React Native)
- **No Testing**: Unless explicitly requested
- **No Comments**: Don't add code comments as guides, only for relevant function documentation

## Critical Patterns

### Mobile App
- **SDK Access**: Use `const { sdk } = useGymSdk();` - never import gymspaceClient directly
- **Types**: Use SDK types directly, don't duplicate DTOs
- **Loading**: Use `useLoadingScreen().execute()` for async operations
- **Forms**: Use components from `@/components/forms/`
- **Config**: Use `useCountryConfig()`, `useFormatPrice()` from ConfigContext

### Backend
- **Services**: Always pass complete RequestContext as first parameter
- Pattern: `async method(context: IRequestContext, ...params)`

### UI Best Practices
- **Buttons**: Use variants (solid/outline), no custom colors
- **Forms**: react-hook-form + FormProvider + zod validation
- **State**: zustand for complex state, TanStack Query for server state

## Navigation
- **Pattern**: Use `router.push()` for programmatic navigation
- **Structure**: Tab navigation for main app, stack navigation within features
- **Routes**: `/(onboarding)/` for auth, `/(app)/` for main app with tabs

## Preferences
- Respond in English
- Use Serena when available
- No examples unless requested
- No README.md creation
- No commands unless requested
- No lint commands