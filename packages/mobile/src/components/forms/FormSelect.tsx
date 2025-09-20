import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import type { UseControllerProps, FieldValues } from 'react-hook-form';
import { View, ScrollView } from 'react-native';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlHelper,
  FormControlHelperText,
} from '@/components/ui/form-control';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop, BottomSheetFooter } from '@gorhom/bottom-sheet';
import { ChevronDownIcon, CheckIcon, XIcon } from 'lucide-react-native';
import { tva } from '@gluestack-ui/utils/nativewind-utils';

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
  multiple?: boolean;
  maxSelections?: number;
  searchable?: boolean;
}

// Styles matching the Input component
const selectInputStyle = tva({
  base: 'border-background-300 flex-row overflow-hidden content-center data-[hover=true]:border-outline-400 data-[focus=true]:border-primary-600 data-[focus=true]:hover:border-primary-600 data-[disabled=true]:opacity-40 data-[disabled=true]:hover:border-background-300 items-center',
  variants: {
    size: {
      xl: 'min-h-[56px]',
      lg: 'min-h-[48px]',
      md: 'min-h-[44px]',
      sm: 'min-h-[40px]',
    },
    variant: {
      underlined:
        'rounded-none border-b data-[invalid=true]:border-b-2 data-[invalid=true]:border-error-700',
      outline:
        'rounded-lg border-2 data-[invalid=true]:border-error-700',
      rounded:
        'rounded-xl border-2 data-[invalid=true]:border-error-700',
    },
  },
});

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
  size = 'md',
  variant = 'outline',
  className,
  width,
  multiple = false,
  maxSelections,
}: FormSelectProps<TFieldValues>) {
  const formContext = useFormContext<TFieldValues>();
  const { field, fieldState } = useController({
    name,
    control: control || formContext.control,
    rules,
    defaultValue,
    shouldUnregister,
  });

  const bottomSheetRef = useRef<BottomSheet>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Handle single or multiple values
  const selectedValues = useMemo(() => {
    if (!field.value) return [];
    if (multiple) {
      return Array.isArray(field.value) ? field.value : [];
    }
    return field.value ? [field.value] : [];
  }, [field.value, multiple]);

  const handleOptionToggle = useCallback((value: string) => {
    if (multiple) {
      const currentValues = Array.isArray(field.value) ? field.value : [];
      const isSelected = currentValues.includes(value);
      
      if (isSelected) {
        // Remove from selection
        field.onChange(currentValues.filter(v => v !== value));
      } else {
        // Add to selection if not at max
        if (!maxSelections || currentValues.length < maxSelections) {
          field.onChange([...currentValues, value]);
        }
      }
    } else {
      // Single selection
      field.onChange(value);
      handleClose();
    }
  }, [field, multiple, maxSelections]);

  const handleRemoveValue = useCallback((value: string, e: any) => {
    e.stopPropagation();
    if (multiple) {
      const currentValues = Array.isArray(field.value) ? field.value : [];
      field.onChange(currentValues.filter(v => v !== value));
    }
  }, [field, multiple]);

  const handleOpen = useCallback(() => {
    if (!isDisabled) {
      setIsOpen(true);
      bottomSheetRef.current?.expand();
    }
  }, [isDisabled]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    bottomSheetRef.current?.close();
  }, []);

  const handleClearAll = useCallback(() => {
    field.onChange(multiple ? [] : null);
  }, [field, multiple]);

  const renderDisplayValue = () => {
    if (selectedValues.length === 0) {
      return (
        <Text className="text-typography-500 flex-1 py-0 px-4">
          {placeholder}
        </Text>
      );
    }

    if (multiple) {
      return (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="flex-1 px-2"
        >
          <HStack className="gap-2 items-center py-2">
            {selectedValues.map(value => {
              const option = options.find(opt => opt.value === value);
              if (!option) return null;
              return (
                <Badge 
                  key={value}
                  variant="solid" 
                  className="bg-primary-100 px-2 py-1"
                >
                  <HStack className="items-center gap-1">
                    <Text className="text-primary-700 text-sm">{option.label}</Text>
                    <Pressable onPress={(e) => handleRemoveValue(value, e)}>
                      <Icon as={XIcon} className="text-primary-600 w-3 h-3" />
                    </Pressable>
                  </HStack>
                </Badge>
              );
            })}
          </HStack>
        </ScrollView>
      );
    } else {
      const selectedOption = options.find(opt => opt.value === selectedValues[0]);
      return (
        <Text className="text-typography-900 flex-1 py-0 px-4">
          {selectedOption?.label}
        </Text>
      );
    }
  };

  const renderBottomSheetContent = () => {
    return (
      <BottomSheetView className="flex-1">
        <VStack className="px-4 pb-4">
          {/* Header */}
          <HStack className="justify-between items-center py-4 border-b border-gray-200">
            <Text className="text-lg font-semibold text-gray-900">
              {multiple ? 'Seleccionar opciones' : 'Seleccionar opción'}
            </Text>
            {multiple && selectedValues.length > 0 && (
              <Pressable onPress={handleClearAll}>
                <Text className="text-primary-600 text-sm font-medium">Limpiar</Text>
              </Pressable>
            )}
          </HStack>

          {/* Selection info for multiple */}
          {multiple && maxSelections && (
            <View className="py-3 px-2">
              <View className="bg-blue-50 rounded-md px-3 py-2">
                <Text className="text-sm text-blue-700">
                  {selectedValues.length} de {maxSelections} seleccionados
                </Text>
              </View>
            </View>
          )}

          {/* Options list */}
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <VStack className="py-2">
              {options.map((option) => {
                const isSelected = selectedValues.includes(option.value);
                const isDisabledOption = multiple && maxSelections && 
                  selectedValues.length >= maxSelections && !isSelected;

                return (
                  <Pressable
                    key={option.value}
                    onPress={() => handleOptionToggle(option.value)}
                    disabled={isDisabledOption}
                    className={`py-3 px-4 rounded-lg mb-1 ${
                      isSelected ? 'bg-primary-50 border border-primary-200' : 'bg-white'
                    } ${isDisabledOption ? 'opacity-40' : ''}`}
                  >
                    <HStack className="justify-between items-center">
                      <Text 
                        className={`flex-1 ${
                          isSelected ? 'text-primary-700 font-medium' : 'text-gray-900'
                        } ${isDisabledOption ? 'text-gray-400' : ''}`}
                      >
                        {option.label}
                      </Text>
                      {isSelected && (
                        <View className="w-5 h-5 rounded-full bg-primary-600 items-center justify-center">
                          <Icon as={CheckIcon} className="text-white w-3 h-3" />
                        </View>
                      )}
                    </HStack>
                  </Pressable>
                );
              })}
            </VStack>
          </ScrollView>
        </VStack>
      </BottomSheetView>
    );
  };

  const renderFooter = useCallback(
    (props: any) => {
      if (!multiple) return null;
      
      return (
        <BottomSheetFooter {...props}>
          <View className="px-4 py-3 bg-white border-t border-gray-200">
            <HStack className="gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onPress={handleClose}
              >
                <Text>Cancelar</Text>
              </Button>
              <Button 
                variant="solid"
                className="flex-1"
                onPress={handleClose}
              >
                <Text>Aplicar ({selectedValues.length})</Text>
              </Button>
            </HStack>
          </View>
        </BottomSheetFooter>
      );
    },
    [multiple, selectedValues.length, handleClose]
  );

  return (
    <>
      <FormControl 
        isInvalid={!!fieldState.error} 
        isDisabled={isDisabled} 
        className={className} 
        style={width ? { width } : undefined}
      >
        <VStack className="gap-2">
          {label && (
            <Text className="text-sm font-medium text-typography-900">
              {label}
            </Text>
          )}

          {description && (
            <FormControlHelper>
              <FormControlHelperText>{description}</FormControlHelperText>
            </FormControlHelper>
          )}

          {/* Input-style selector */}
          <Pressable onPress={handleOpen} disabled={isDisabled}>
            <View 
              className={selectInputStyle({ variant, size })}
              data-invalid={!!fieldState.error}
              data-disabled={isDisabled}
            >
              {renderDisplayValue()}
              <View className="pr-4">
                <Icon as={ChevronDownIcon} className="text-typography-400 w-5 h-5" />
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

      {/* Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={['50%', '75%']}
        enablePanDownToClose
        onClose={handleClose}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            opacity={0.5}
            pressBehavior="close"
          />
        )}
        footerComponent={renderFooter}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 10,
        }}
      >
        {renderBottomSheetContent()}
      </BottomSheet>
    </>
  );
}
