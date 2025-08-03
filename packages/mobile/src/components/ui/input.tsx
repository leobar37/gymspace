import React from 'react';
import { TextInput, View, Text } from 'react-native';
import { cn } from '../../lib/utils';

interface InputProps extends React.ComponentProps<typeof TextInput> {
  label?: string;
  error?: string;
  className?: string;
  containerClassName?: string;
}

export const Input = React.forwardRef<TextInput, InputProps>(
  ({ label, error, className, containerClassName, ...props }, ref) => {
    return (
      <View className={cn('w-full', containerClassName)}>
        {label && (
          <Text className="text-sm font-medium text-gray-700 mb-1">
            {label}
          </Text>
        )}
        <TextInput
          ref={ref}
          className={cn(
            'flex h-10 w-full rounded-md  border-gray-300 bg-white px-3 py-2 text-sm',
            'placeholder:text-gray-400',
            'focus:border-blue-500 focus:outline-none',
            'disabled:opacity-50',
            error && 'border-red-500',
            className
          )}
          placeholderTextColor="#9CA3AF"
          {...props}
        />
        {error && (
          <Text className="text-sm text-red-500 mt-1">{error}</Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';