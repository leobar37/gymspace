import React, { useState } from 'react';
import { View, Platform, Modal, TouchableWithoutFeedback } from 'react-native';
import { useController } from 'react-hook-form';
import type { UseControllerProps, FieldValues } from 'react-hook-form';
import { Picker } from '@react-native-picker/picker';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { FormControl, FormControlError, FormControlErrorText, FormControlHelper, FormControlHelperText } from '@/components/ui/form-control';
import { Button, ButtonText } from '@/components/ui/button';
import { Pressable } from '@/components/ui/pressable';
import { Icon } from '@/components/ui/icon';
import { ChevronDownIcon, XIcon } from 'lucide-react-native';

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
  
  const [showModal, setShowModal] = useState(false);
  const [tempValue, setTempValue] = useState(field.value || '');
  
  const selectedOption = options.find(opt => opt.value === field.value);
  
  const handleSave = () => {
    field.onChange(tempValue);
    setShowModal(false);
  };
  
  const handleCancel = () => {
    setTempValue(field.value || '');
    setShowModal(false);
  };
  
  const openModal = () => {
    if (enabled) {
      setTempValue(field.value || '');
      setShowModal(true);
    }
  };
  
  return (
    <>
      <FormControl isInvalid={!!fieldState.error}>
        <VStack className="gap-1">
          {label && <Text className="font-medium text-gray-900">{label}</Text>}
          
          {description && (
            <FormControlHelper>
              <FormControlHelperText>{description}</FormControlHelperText>
            </FormControlHelper>
          )}
          
          <Pressable
            onPress={openModal}
            disabled={!enabled}
          >
            <View className={`
              bg-white 
              border 
              ${fieldState.error ? 'border-red-500' : 'border-gray-300'} 
              rounded-lg 
              px-4
              py-3
              min-h-[48px]
              ${!enabled ? 'opacity-50' : ''}
            `}>
              <HStack className="justify-between items-center">
                <Text className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
                  {selectedOption ? selectedOption.label : placeholder}
                </Text>
                <Icon as={ChevronDownIcon} className="text-gray-400" size="md" />
              </HStack>
            </View>
          </Pressable>
          
          {fieldState.error && (
            <FormControlError>
              <FormControlErrorText>{fieldState.error.message}</FormControlErrorText>
            </FormControlError>
          )}
        </VStack>
      </FormControl>
      
      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowModal(false)}>
          <View className="flex-1 bg-black/50 justify-center items-center px-6">
            <TouchableWithoutFeedback>
              <View className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
                {/* Header */}
                <View className="px-6 py-4 border-b border-gray-200">
                  <HStack className="justify-between items-center">
                    <Text className="text-lg font-semibold text-gray-900">
                      {label || 'Seleccionar opción'}
                    </Text>
                    <Pressable onPress={() => setShowModal(false)}>
                      <Icon as={XIcon} className="text-gray-400" size="md" />
                    </Pressable>
                  </HStack>
                </View>
                
                {/* Picker */}
                <View className="h-48">
                  <Picker
                    selectedValue={tempValue}
                    onValueChange={(itemValue) => setTempValue(itemValue)}
                    style={{
                      height: Platform.OS === 'ios' ? 192 : '100%',
                      width: '100%',
                    }}
                    itemStyle={{
                      height: 120,
                      fontSize: 16,
                    }}
                  >
                    {!tempValue && (
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
                
                {/* Footer */}
                <View className="px-6 py-4 border-t border-gray-200">
                  <HStack className="gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={handleCancel}
                      className="flex-1"
                    >
                      <ButtonText>Cancelar</ButtonText>
                    </Button>
                    <Button
                      size="sm"
                      onPress={handleSave}
                      className="flex-1"
                    >
                      <ButtonText>Seleccionar</ButtonText>
                    </Button>
                  </HStack>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}