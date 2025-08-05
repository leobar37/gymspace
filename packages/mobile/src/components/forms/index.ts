// Form Provider
export { FormProvider } from './FormProvider';

// Form Components
export { FormInput } from './FormInput';
export { FormTextarea } from './FormTextarea';
export { FormSelect } from './FormSelect';
export { FormCheckbox } from './FormCheckbox';
export { FormRadio } from './FormRadio';
export { FormSwitch } from './FormSwitch';
export { FormDatePicker } from './FormDatePicker';

// Form Utilities
export {
  createSubmitHandler,
  resetForm,
  clearErrors,
  setFormErrors,
  hasErrors,
  getFormValues,
  watchFields,
  fieldNames
} from './form-utils';

// Re-export react-hook-form types for convenience
export type {
  UseFormReturn,
  FieldValues,
  SubmitHandler,
  SubmitErrorHandler,
  UseControllerProps,
  FieldErrors,
  FieldError,
  Path,
  PathValue,
  Control,
  UseFormRegister,
  UseFormSetValue,
  UseFormGetValues,
  UseFormWatch,
  UseFormReset,
  UseFormClearErrors,
  UseFormSetError,
  UseFormTrigger,
  UseFormStateReturn,
  FormState,
  DefaultValues,
  ValidationMode,
  ReValidateMode,
  UseFormProps,
  Resolver
} from 'react-hook-form';

// Re-export useForm and zodResolver for convenience
export { useForm, Controller, useController, useFormContext } from 'react-hook-form';
export { zodResolver } from '@hookform/resolvers/zod';