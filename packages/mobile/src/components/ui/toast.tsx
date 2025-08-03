import React from 'react';
import { View, Text } from 'react-native';
import { cn } from '../../lib/utils';

interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning';
  className?: string;
}

export function Toast({ 
  title, 
  description, 
  variant = 'default',
  className 
}: ToastProps) {
  const variants = {
    default: 'bg-gray-800 border-gray-700',
    success: 'bg-green-600 border-green-500',
    error: 'bg-red-600 border-red-500',
    warning: 'bg-yellow-600 border-yellow-500',
  };

  return (
    <View 
      className={cn(
        'px-4 py-3 rounded-lg border',
        variants[variant],
        className
      )}
    >
      {title && (
        <Text className="text-white font-semibold text-base">
          {title}
        </Text>
      )}
      {description && (
        <Text className="text-white/90 text-sm mt-1">
          {description}
        </Text>
      )}
    </View>
  );
}