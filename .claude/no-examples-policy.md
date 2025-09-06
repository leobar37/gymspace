# No Examples Policy

## Policy Statement
Do NOT create example files, demo files, or example folders in the codebase unless explicitly requested by the user.

## Rationale
- Examples add unnecessary clutter to the production codebase
- They can confuse developers about what code is actually in use
- Examples should only be created when specifically needed for documentation or demonstration purposes

## Specific Restrictions
1. Do not create files with names like:
   - `example-usage.tsx`
   - `demo.tsx`
   - `sample.tsx`
   - Any file in an `examples/` folder

2. Do not create folders named:
   - `examples/`
   - `demos/`
   - `samples/`

3. Do not create README files in component folders unless requested

## Exceptions
Only create example files when:
- The user explicitly requests examples
- The user asks for demonstration code
- The user needs documentation with code samples

## Implementation
When creating new features or components:
- Focus on the actual implementation files
- Create only the necessary production code
- Document usage in comments within the actual component if needed
- Use TypeScript types and interfaces for self-documentation

Last Updated: 2025-09-06