import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Modal } from './modal';
import { cn } from '../../lib/utils';

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function Select({
  value,
  onValueChange,
  options,
  placeholder = 'Select an option',
  label,
  disabled = false,
  className,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <View className={className}>
      {label && (
        <Text className="text-sm font-medium text-gray-700 mb-1">
          {label}
        </Text>
      )}
      
      <Pressable
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        className={cn(
          'flex-row items-center justify-between h-10 px-3 py-2 rounded-md border border-gray-300 bg-white',
          disabled && 'opacity-50'
        )}
      >
        <Text
          className={cn(
            'text-sm',
            selectedOption ? 'text-gray-900' : 'text-gray-400'
          )}
        >
          {selectedOption?.label || placeholder}
        </Text>
        <Text className="text-gray-400">▼</Text>
      </Pressable>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Select an option"
        size="md"
      >
        <ScrollView className="max-h-80">
          {options.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => {
                onValueChange(option.value);
                setIsOpen(false);
              }}
              className={cn(
                'py-3 px-4 border-b border-gray-100',
                value === option.value && 'bg-blue-50'
              )}
            >
              <Text
                className={cn(
                  'text-sm',
                  value === option.value
                    ? 'text-blue-600 font-medium'
                    : 'text-gray-700'
                )}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </Modal>
    </View>
  );
}