import React from 'react';
import { useController } from 'react-hook-form';
import type { UseControllerProps, FieldValues } from 'react-hook-form';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Textarea, TextareaInput } from '@/components/ui/textarea';
import { FormControl, FormControlError, FormControlErrorText, FormControlHelper, FormControlHelperText } from '@/components/ui/form-control';
import type { ComponentProps } from 'react';

type TextareaInputPropsWithoutConflicts = Omit<
  ComponentProps<typeof TextareaInput>,
  'value' | 'onChangeText' | 'onBlur' | 'defaultValue'
>;

interface FormTextareaProps<TFieldValues extends FieldValues = FieldValues>
  extends UseControllerProps<TFieldValues>,
    TextareaInputPropsWithoutConflicts {
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