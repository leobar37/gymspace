import React from 'react';
import { useController } from 'react-hook-form';
import type { UseControllerProps, FieldValues } from 'react-hook-form';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Input as GluestackInput, InputField } from '@/components/ui/input';
import { FormControl, FormControlError, FormControlErrorText, FormControlHelper, FormControlHelperText } from '@/components/ui/form-control';
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
      <VStack className="gap-3">
        {label && <Text className="font-medium text-gray-900">{label}</Text>}
        {description && (
          <FormControlHelper>
            <FormControlHelperText>{description}</FormControlHelperText>
          </FormControlHelper>
        )}

        <GluestackInput
          variant="rounded"
          size="md"
        >
          <InputField
            value={field.value || ''}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholderClassName="text-gray-400"
            {...props}
          />
        </GluestackInput>

        {fieldState.error && (
          <FormControlError>
            <FormControlErrorText>{fieldState.error.message}</FormControlErrorText>
          </FormControlError>
        )}
      </VStack>
    </FormControl>
  );
}