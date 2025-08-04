import React from 'react';
import { useController } from 'react-hook-form';
import type { UseControllerProps, FieldValues } from 'react-hook-form';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Checkbox as GluestackCheckbox, CheckboxIndicator, CheckboxIcon, CheckboxLabel } from '@/components/ui/checkbox';
import { FormControl, FormControlError, FormControlErrorText, FormControlHelper, FormControlHelperText } from '@/components/ui/form-control';
import { Icon } from '@/components/ui/icon';
import { CheckIcon } from 'lucide-react-native';

interface FormCheckboxProps<TFieldValues extends FieldValues = FieldValues> 
  extends UseControllerProps<TFieldValues> {
  label: string;
  description?: string;
}

export function FormCheckbox<TFieldValues extends FieldValues = FieldValues>({ 
  name, 
  control,
  rules,
  defaultValue,
  shouldUnregister,
  label, 
  description
}: FormCheckboxProps<TFieldValues>) {
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
        <HStack className="gap-2" alignItems="center">
          <GluestackCheckbox
            value={field.value}
            isChecked={field.value}
            onChange={(isSelected) => field.onChange(isSelected)}
            onBlur={field.onBlur}
          >
            <CheckboxIndicator>
              <CheckboxIcon as={CheckIcon} />
            </CheckboxIndicator>
            <CheckboxLabel>
              <Text className="font-medium text-gray-900">{label}</Text>
            </CheckboxLabel>
          </GluestackCheckbox>
        </HStack>
        
        {description && (
          <FormControlHelper>
            <FormControlHelperText className="ml-6">{description}</FormControlHelperText>
          </FormControlHelper>
        )}
        
        {fieldState.error && (
          <FormControlError>
            <FormControlErrorText>{fieldState.error.message}</FormControlErrorText>
          </FormControlError>
        )}
      </VStack>
    </FormControl>
  );
}