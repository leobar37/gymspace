import React from 'react';
import { useController, useFormContext } from 'react-hook-form';
import type { UseControllerProps, FieldValues } from 'react-hook-form';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Input as GluestackInput, InputField } from '@/components/ui/input';
import { FormControl, FormControlError, FormControlErrorText, FormControlHelper, FormControlHelperText } from '@/components/ui/form-control';
import { HStack } from '@/components/ui/hstack';
import type { ComponentProps, ReactNode } from 'react';

interface FormInputProps<TFieldValues extends FieldValues = FieldValues>
  extends Omit<UseControllerProps<TFieldValues>, 'control'>,
  Omit<ComponentProps<typeof InputField>, 'value' | 'onChangeText' | 'onBlur' | 'defaultValue'> {
  label: string;
  description?: string;
  control?: UseControllerProps<TFieldValues>['control'];
  leftIcon?: ReactNode;
  transform?: {
    input: (value: any) => any;
    output: (value: any) => any;
  };
}

export function FormInput<TFieldValues extends FieldValues = FieldValues>({
  name,
  control,
  rules,
  defaultValue,
  shouldUnregister,
  label,
  description,
  leftIcon,
  transform,
  ...props
}: FormInputProps<TFieldValues>) {
  const formContext = useFormContext<TFieldValues>();
  const { field, fieldState } = useController({
    name,
    control: control || formContext.control,
    rules,
    defaultValue,
    shouldUnregister
  });

  return (
    <FormControl isInvalid={!!fieldState.error}>
      <VStack className="gap-3">
        {label && (
          <HStack className="items-center gap-2">
            {leftIcon}
            <Text className="font-medium text-gray-900">{label}</Text>
          </HStack>
        )}
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
            value={transform?.input ? transform.input(field.value) : (field.value || '')}
            onChangeText={(text) => {
              const transformedValue = transform?.output ? transform.output(text) : text;
              field.onChange(transformedValue);
            }}
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