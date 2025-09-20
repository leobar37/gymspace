import React, { useState, useCallback } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import type { UseControllerProps, FieldValues } from 'react-hook-form';
import { View } from 'react-native';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { Icon } from '@/components/ui/icon';
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlHelper,
  FormControlHelperText,
} from '@/components/ui/form-control';
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetItem,
  ActionsheetItemText
} from '@/components/ui/actionsheet';
import { ChevronDownIcon, CheckIcon } from 'lucide-react-native';

interface SelectOption {
  label: string;
  value: string;
}

interface FormSelectProps<TFieldValues extends FieldValues = FieldValues>
  extends Omit<UseControllerProps<TFieldValues>, 'control'> {
  label?: string;
  description?: string;
  placeholder?: string;
  options: SelectOption[];
  isDisabled?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'outline' | 'underlined' | 'rounded';
  control?: UseControllerProps<TFieldValues>['control'];
  className?: string;
  width?: number | string;
}

export function FormSelect<TFieldValues extends FieldValues = FieldValues>({
  name,
  control,
  rules,
  defaultValue,
  shouldUnregister,
  label,
  description,
  placeholder = 'Seleccionar opción',
  options,
  isDisabled = false,
  className,
  width,
}: FormSelectProps<TFieldValues>) {
  const formContext = useFormContext<TFieldValues>();
  const { field, fieldState } = useController({
    name,
    control: control || formContext.control,
    rules,
    defaultValue,
    shouldUnregister,
  });

  const [showOptions, setShowOptions] = useState(false);

  const handleOptionSelect = useCallback((value: string) => {
    field.onChange(value);
    setShowOptions(false);
  }, [field]);

  const selectedOption = options.find(opt => opt.value === field.value);

  const getDisplayValue = () => {
    if (selectedOption) {
      return (
        <HStack className="justify-between items-center flex-1">
          <Text className="text-gray-900">{selectedOption.label}</Text>
          <Icon as={ChevronDownIcon} className="text-gray-400 w-5 h-5" />
        </HStack>
      );
    }

    return (
      <HStack className="justify-between items-center flex-1">
        <Text className="text-gray-400">{placeholder}</Text>
        <Icon as={ChevronDownIcon} className="text-gray-400 w-5 h-5" />
      </HStack>
    );
  };

  return (
    <>
      <FormControl isInvalid={!!fieldState.error} isDisabled={isDisabled} className={className} style={width ? { width } : undefined}>
        <VStack className="gap-3">
          {label && <Text className="font-medium text-gray-900">{label}</Text>}

          {description && (
            <FormControlHelper>
              <FormControlHelperText>{description}</FormControlHelperText>
            </FormControlHelper>
          )}

          {/* Selector Button */}
          <Pressable onPress={() => setShowOptions(true)} disabled={isDisabled}>
            <View className="border h-9 border-gray-300">
              <View className="px-3 py-2 justify-center">
                {getDisplayValue()}
              </View>
            </View>
          </Pressable>

          {fieldState.error && (
            <FormControlError>
              <FormControlErrorText>{fieldState.error.message}</FormControlErrorText>
            </FormControlError>
          )}
        </VStack>
      </FormControl>

      {/* Options Actionsheet */}
      <Actionsheet isOpen={showOptions} onClose={() => setShowOptions(false)}>
        <ActionsheetBackdrop />
        <ActionsheetContent className="pb-6">
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>

          <VStack className="w-full">
            {options.map((option) => (
              <ActionsheetItem
                key={option.value}
                onPress={() => handleOptionSelect(option.value)}
                className="w-full"
              >
                <HStack className="justify-between items-center flex-1 py-2">
                  <ActionsheetItemText className="flex-1">{option.label}</ActionsheetItemText>
                  {field.value === option.value && (
                    <Icon as={CheckIcon} className="text-blue-500 w-5 h-5 ml-2" />
                  )}
                </HStack>
              </ActionsheetItem>
            ))}
          </VStack>
        </ActionsheetContent>
      </Actionsheet>
    </>
  );
}
