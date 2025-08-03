import React from 'react';
import { View, Text } from 'react-native';
import { cn } from '../../lib/utils';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  children?: React.ReactNode;
}

export function Divider({
  orientation = 'horizontal',
  className,
  children,
}: DividerProps) {
  if (children) {
    return (
      <View className={cn('flex-row items-center', className)}>
        <View className="flex-1 h-px bg-gray-300" />
        <Text className="px-3 text-sm text-gray-500">{children}</Text>
        <View className="flex-1 h-px bg-gray-300" />
      </View>
    );
  }

  return (
    <View
      className={cn(
        orientation === 'horizontal'
          ? 'h-px w-full bg-gray-300'
          : 'w-px h-full bg-gray-300',
        className
      )}
    />
  );
}