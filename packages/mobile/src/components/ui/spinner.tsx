import React from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { cn } from '../../lib/utils';

interface SpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  label?: string;
  className?: string;
}

export function Spinner({
  size = 'large',
  color = '#3B82F6',
  label,
  className,
}: SpinnerProps) {
  return (
    <View className={cn('items-center justify-center', className)}>
      <ActivityIndicator size={size} color={color} />
      {label && (
        <Text className="text-sm text-gray-600 mt-2">{label}</Text>
      )}
    </View>
  );
}