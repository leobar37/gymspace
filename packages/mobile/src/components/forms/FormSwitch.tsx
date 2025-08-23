import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlHelper,
  FormControlHelperText,
} from '@/components/ui/form-control';
import { HStack } from '@/components/ui/hstack';
import { Switch as GluestackSwitch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import React from 'react';
import type { FieldValues, UseControllerProps } from 'react-hook-form';
import { useController } from 'react-hook-form';

interface FormSwitchProps<TFieldValues extends FieldValues = FieldValues>
  extends UseControllerProps<TFieldValues> {
  label: string;
  description?: string;
}

export function FormSwitch<TFieldValues extends FieldValues = FieldValues>({
  name,
  control,
  rules,
  defaultValue,
  shouldUnregister,
  label,
  description,
}: FormSwitchProps<TFieldValues>) {
  const { field, fieldState } = useController({
    name,
    control,
    rules,
    defaultValue,
    shouldUnregister,
  });

  return (
    <FormControl isInvalid={!!fieldState.error}>
      <VStack className="gap-1">
        <HStack className="justify-between items-center">
          <VStack className="flex-1 mr-4">
            <Text className="font-medium text-gray-900">{label}</Text>
            {description && (
              <FormControlHelper>
                <FormControlHelperText>{description}</FormControlHelperText>
              </FormControlHelper>
            )}
          </VStack>

          <GluestackSwitch value={field.value} onValueChange={field.onChange} />
        </HStack>

        {fieldState.error && (
          <FormControlError>
            <FormControlErrorText>{fieldState.error.message}</FormControlErrorText>
          </FormControlError>
        )}
      </VStack>
    </FormControl>
  );
}
