import type { FieldValues, UseFormReturn, SubmitHandler, SubmitErrorHandler } from 'react-hook-form';

/**
 * Creates a submit handler with built-in error handling
 */
export function createSubmitHandler<TFieldValues extends FieldValues = FieldValues>(
  onValid: SubmitHandler<TFieldValues>,
  onInvalid?: SubmitErrorHandler<TFieldValues>
) {
  return (methods: UseFormReturn<TFieldValues>) => {
    return methods.handleSubmit(onValid, onInvalid);
  };
}

/**
 * Resets form to initial values
 */
export function resetForm<TFieldValues extends FieldValues = FieldValues>(
  methods: UseFormReturn<TFieldValues>,
  defaultValues?: TFieldValues
) {
  if (defaultValues) {
    methods.reset(defaultValues);
  } else {
    methods.reset();
  }
}

/**
 * Clears all form errors
 */
export function clearErrors<TFieldValues extends FieldValues = FieldValues>(
  methods: UseFormReturn<TFieldValues>
) {
  methods.clearErrors();
}

/**
 * Sets multiple form errors at once
 */
export function setFormErrors<TFieldValues extends FieldValues = FieldValues>(
  methods: UseFormReturn<TFieldValues>,
  errors: Partial<Record<keyof TFieldValues, string>>
) {
  Object.entries(errors).forEach(([field, message]) => {
    if (message) {
      methods.setError(field as any, { type: 'manual', message });
    }
  });
}

/**
 * Checks if form has any errors
 */
export function hasErrors<TFieldValues extends FieldValues = FieldValues>(
  methods: UseFormReturn<TFieldValues>
): boolean {
  return Object.keys(methods.formState.errors).length > 0;
}

/**
 * Gets all current form values
 */
export function getFormValues<TFieldValues extends FieldValues = FieldValues>(
  methods: UseFormReturn<TFieldValues>
): TFieldValues {
  return methods.getValues();
}

/**
 * Watches specific form fields for changes
 */
export function watchFields<TFieldValues extends FieldValues = FieldValues>(
  methods: UseFormReturn<TFieldValues>,
  fields: (keyof TFieldValues)[]
) {
  return methods.watch(fields as any);
}

/**
 * Type-safe form field names helper
 */
export function fieldNames<TFieldValues extends FieldValues>() {
  return <K extends keyof TFieldValues>(name: K): K => name;
}