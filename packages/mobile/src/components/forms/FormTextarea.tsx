import React from 'react';
import { useController } from 'react-hook-form';
import type { UseControllerProps, FieldValues } from 'react-hook-form';
import { 
  VStack, 
  Text, 
  Textarea, 
  TextareaInput,
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlHelper,
  FormControlHelperText
} from '../ui';
import type { ComponentProps } from 'react';

interface FormTextareaProps<TFieldValues extends FieldValues = FieldValues> 
  extends UseControllerProps<TFieldValues>,
    Omit<ComponentProps<typeof TextareaInput>, 'value' | 'onChangeText' | 'onBlur'> {
  label: string;
  description?: string;
}

export function FormTextarea<TFieldValues extends FieldValues = FieldValues>({ 
  name, 
  control,
  rules,
  defaultValue,
  shouldUnregister,
  label, 
  description, 
  ...props 
}: FormTextareaProps<TFieldValues>) {
  const { field, fieldState } = useController({ 
    name, 
    control,
    rules,
    defaultValue,
    shouldUnregister
  });
  
  return (
    <FormControl isInvalid={!!fieldState.error}>
      <VStack className="gap-1">
        <Text className="font-medium text-gray-900">{label}</Text>
        
        {description && (
          <FormControlHelper>
            <FormControlHelperText>{description}</FormControlHelperText>
          </FormControlHelper>
        )}
        
        <Textarea>
          <TextareaInput
            value={field.value || ''}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            {...props}
          />
        </Textarea>
        
        {fieldState.error && (
          <FormControlError>
            <FormControlErrorText>{fieldState.error.message}</FormControlErrorText>
          </FormControlError>
        )}
      </VStack>
    </FormControl>
  );
}