import React, { useState } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import type { UseControllerProps, FieldValues } from 'react-hook-form';
import { Pressable } from 'react-native';
import { Lock, Eye, EyeOff } from 'lucide-react-native';

import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Input as GluestackInput, InputField, InputSlot } from '@/components/ui/input';
import { FormControl, FormControlError, FormControlErrorText, FormControlHelper, FormControlHelperText } from '@/components/ui/form-control';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import type { ComponentProps, ReactNode } from 'react';

interface FormPasswordProps<TFieldValues extends FieldValues = FieldValues>
  extends Omit<UseControllerProps<TFieldValues>, 'control'>,
  Omit<ComponentProps<typeof InputField>, 'value' | 'onChangeText' | 'onBlur' | 'defaultValue' | 'secureTextEntry'> {
  label: string;
  description?: string;
  control?: UseControllerProps<TFieldValues>['control'];
  leftIcon?: ReactNode;
}

export function FormPassword<TFieldValues extends FieldValues = FieldValues>({
  name,
  control,
  rules,
  defaultValue,
  shouldUnregister,
  label,
  description,
  leftIcon,
  ...props
}: FormPasswordProps<TFieldValues>) {
  const formContext = useFormContext<TFieldValues>();
  const { field, fieldState } = useController({
    name,
    control: control || formContext.control,
    rules,
    defaultValue,
    shouldUnregister
  });

  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <FormControl isInvalid={!!fieldState.error}>
      <VStack className="gap-3">
        {label && (
          <HStack className="items-center gap-2">
            {leftIcon || <Icon as={Lock} className="text-gray-500 w-5 h-5" />}
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
          className="relative"
        >
          <InputField
            value={field.value || ''}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            secureTextEntry={!showPassword}
            placeholderClassName="text-gray-400"
            {...props}
          />
          <InputSlot className="pr-3">
            <Pressable onPress={togglePasswordVisibility}>
              <Icon 
                as={showPassword ? EyeOff : Eye} 
                className="text-gray-500 w-5 h-5" 
              />
            </Pressable>
          </InputSlot>
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