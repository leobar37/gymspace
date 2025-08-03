import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { cn } from '../../lib/utils';

interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({
  checked,
  onCheckedChange,
  label,
  disabled = false,
  className,
}: CheckboxProps) {
  return (
    <Pressable
      onPress={() => !disabled && onCheckedChange(!checked)}
      disabled={disabled}
      className={cn('flex-row items-center', className)}
    >
      <View
        className={cn(
          'h-5 w-5 rounded border-2 items-center justify-center',
          checked
            ? 'bg-blue-500 border-blue-500'
            : 'bg-white border-gray-300',
          disabled && 'opacity-50'
        )}
      >
        {checked && (
          <Text className="text-white font-bold text-xs">✓</Text>
        )}
      </View>
      {label && (
        <Text
          className={cn(
            'ml-2 text-sm text-gray-700',
            disabled && 'opacity-50'
          )}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}