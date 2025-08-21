import { Card } from '@/components/ui/card';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import React from 'react';
import { Pressable, View } from 'react-native';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<any>;
  iconColor: string;
  onPress?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconColor,
  onPress,
}) => {
  const content = (
    <Card className="p-4 bg-white">
      <HStack className="items-center justify-between">
        <VStack className="flex-1">
          <Text className="text-sm text-gray-600 mb-1">{title}</Text>
          <Text className="text-2xl font-bold text-gray-900">{value}</Text>
          {subtitle && (
            <Text className="text-xs text-gray-500 mt-1">{subtitle}</Text>
          )}
        </VStack>
        <View className={`p-3 rounded-full ${iconColor}`}>
          <Icon as={icon} className="w-6 h-6 text-white" />
        </View>
      </HStack>
    </Card>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }

  return content;
};