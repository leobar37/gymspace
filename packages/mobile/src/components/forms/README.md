# Form Components

This directory contains a complete integration of Gluestack UI components with React Hook Form and Zod validation.

## Components

### FormProvider
A wrapper around React Hook Form's FormProvider that passes form methods to child components.

### Form Input Components

- **FormInput** - Text input fields with label and description
- **FormTextarea** - Multi-line text input with label and description  
- **FormSelect** - Dropdown selection with label and description
- **FormCheckbox** - Single checkbox with label and description
- **FormRadio** - Radio button group with label and description
- **FormSwitch** - Toggle switch with label and description

### Features

- **Consistent Labeling** - Every input has a label for better accessibility
- **Optional Descriptions** - Help text to guide users
- **Error Handling** - Automatic error display from React Hook Form
- **TypeScript Support** - Full type safety with generics
- **Zod Integration** - Schema validation out of the box

## Usage

```tsx
import { z } from 'zod';
import { useForm, FormProvider, FormInput, zodResolver } from '@/components/forms';

// 1. Define your schema
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

// 2. Setup form
const methods = useForm({
  resolver: zodResolver(schema),
  defaultValues: { email: '', password: '' }
});

// 3. Use in component
<FormProvider {...methods}>
  <FormInput 
    name="email" 
    label="Email"
    description="Your email address"
  />
  <FormInput 
    name="password" 
    label="Password"
    description="Min 8 characters"
    secureTextEntry
  />
</FormProvider>
```

## Benefits

1. **Consistent UI** - All forms look and behave the same
2. **Accessibility** - Proper labels and ARIA attributes
3. **User Guidance** - Descriptions help users understand requirements
4. **Type Safety** - Full TypeScript support with Zod schemas
5. **Error Handling** - Automatic validation and error display
6. **Clean API** - Simple props for common use cases