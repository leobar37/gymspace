import React from 'react';
import { View, Platform } from 'react-native';
import { useController } from 'react-hook-form';
import type { UseControllerProps, FieldValues } from 'react-hook-form';
import { Picker } from '@react-native-picker/picker';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { FormControl, FormControlError, FormControlErrorText, FormControlHelper, FormControlHelperText } from '@/components/ui/form-control';

interface SelectOption {
  label: string;
  value: string;
}

interface FormSelectProps<TFieldValues extends FieldValues = FieldValues> 
  extends UseControllerProps<TFieldValues> {
  label?: string;
  description?: string;
  placeholder?: string;
  options: SelectOption[];
  enabled?: boolean;
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
  enabled = true
}: FormSelectProps<TFieldValues>) {
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
        {label && <Text className="font-medium text-gray-900">{label}</Text>}
        
        {description && (
          <FormControlHelper>
            <FormControlHelperText>{description}</FormControlHelperText>
          </FormControlHelper>
        )}
        
        <View className={`
          bg-white 
          border 
          ${fieldState.error ? 'border-red-500' : 'border-gray-300'} 
          rounded-lg 
          overflow-hidden
          ${!enabled ? 'opacity-50' : ''}
        `}>
          <Picker
            selectedValue={field.value || ''}
            onValueChange={(itemValue) => field.onChange(itemValue)}
            enabled={enabled}
            style={{
              height: Platform.OS === 'ios' ? 200 : 56,
              width: '100%',
            }}
            itemStyle={Platform.OS === 'ios' ? {
              height: 200,
              fontSize: 16,
            } : undefined}
          >
            {!field.value && (
              <Picker.Item 
                label={placeholder} 
                value="" 
                color="#9CA3AF"
              />
            )}
            {options.map((option) => (
              <Picker.Item 
                key={option.value} 
                label={option.label} 
                value={option.value}
              />
            ))}
          </Picker>
        </View>
        
        {fieldState.error && (
          <FormControlError>
            <FormControlErrorText>{fieldState.error.message}</FormControlErrorText>
          </FormControlError>
        )}
      </VStack>
    </FormControl>
  );
}