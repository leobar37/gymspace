import React from 'react';
import { Switch as RNSwitch, View, Text, Pressable } from 'react-native';
import { cn } from '../../lib/utils';

interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
}

export function Switch({
  value,
  onValueChange,
  label,
  disabled = false,
  className,
  labelClassName,
}: SwitchProps) {
  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      disabled={disabled}
      className={cn('flex-row items-center', className)}
    >
      {label && (
        <Text
          className={cn(
            'text-sm font-medium text-gray-700 mr-3',
            disabled && 'opacity-50',
            labelClassName
          )}
        >
          {label}
        </Text>
      )}
      <RNSwitch
        trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
        thumbColor={value ? '#FFFFFF' : '#F3F4F6'}
        ios_backgroundColor="#D1D5DB"
        onValueChange={onValueChange}
        value={value}
        disabled={disabled}
      />
    </Pressable>
  );
}