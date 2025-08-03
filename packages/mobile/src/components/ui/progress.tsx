import React from 'react';
import { View } from 'react-native';
import { cn } from '../../lib/utils';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  indicatorClassName?: string;
}

export function Progress({
  value,
  max = 100,
  className,
  indicatorClassName,
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <View
      className={cn(
        'relative h-2 w-full overflow-hidden rounded-full bg-gray-200',
        className
      )}
    >
      <View
        className={cn(
          'h-full bg-blue-500 transition-all',
          indicatorClassName
        )}
        style={{ width: `${percentage}%` }}
      />
    </View>
  );
}