import React from 'react';
import { View, Text, Image } from 'react-native';
import { cn } from '../../lib/utils';

interface AvatarProps {
  source?: { uri: string };
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({ source, fallback, size = 'md', className }: AvatarProps) {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-xl',
  };

  return (
    <View
      className={cn(
        'relative rounded-full overflow-hidden bg-gray-200',
        sizes[size],
        className
      )}
    >
      {source?.uri ? (
        <Image
          source={source}
          className="w-full h-full"
          resizeMode="cover"
        />
      ) : (
        <View className="w-full h-full items-center justify-center bg-gray-300">
          <Text className={cn('font-semibold text-gray-600', textSizes[size])}>
            {fallback || '?'}
          </Text>
        </View>
      )}
    </View>
  );
}

interface AvatarGroupProps {
  children: React.ReactNode;
  max?: number;
  className?: string;
}

export function AvatarGroup({ children, max = 3, className }: AvatarGroupProps) {
  const childrenArray = React.Children.toArray(children);
  const displayChildren = childrenArray.slice(0, max);
  const remainingCount = childrenArray.length - max;

  return (
    <View className={cn('flex-row -space-x-3', className)}>
      {displayChildren.map((child, index) => (
        <View key={index} className={index === 0 ? 'z-30' : index === 1 ? 'z-20' : 'z-10'}>
          {child}
        </View>
      ))}
      {remainingCount > 0 && (
        <View
          className="h-10 w-10 rounded-full bg-gray-300 items-center justify-center z-0"
        >
          <Text className="text-sm font-semibold text-gray-600">
            +{remainingCount}
          </Text>
        </View>
      )}
    </View>
  );
}