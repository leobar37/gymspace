import React from 'react';
import { useController } from 'react-hook-form';
import type { UseControllerProps, FieldValues } from 'react-hook-form';
import { 
  VStack, 
  Text, 
  GluestackInput as Input, 
  InputField,
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlHelper,
  FormControlHelperText
} from '../ui';
import type { ComponentProps } from 'react';

interface FormInputProps<TFieldValues extends FieldValues = FieldValues> 
  extends UseControllerProps<TFieldValues>,
    Omit<ComponentProps<typeof InputField>, 'value' | 'onChangeText' | 'onBlur'> {
  label: string;
  description?: string;
}

export function FormInput<TFieldValues extends FieldValues = FieldValues>({ 
  name, 
  control,
  rules,
  defaultValue,
  shouldUnregister,
  label, 
  description, 
  ...props 
}: FormInputProps<TFieldValues>) {
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
        
        <Input
          variant="outline"
          size="md"
          className="border border-gray-300 rounded-lg bg-white"
        >
          <InputField
            value={field.value || ''}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            className="px-3 py-2 text-base text-gray-900"
            placeholderClassName="text-gray-400"
            {...props}
          />
        </Input>
        
        {fieldState.error && (
          <FormControlError>
            <FormControlErrorText>{fieldState.error.message}</FormControlErrorText>
          </FormControlError>
        )}
      </VStack>
    </FormControl>
  );
}