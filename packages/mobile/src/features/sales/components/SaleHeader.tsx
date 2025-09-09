import React from 'react';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { ChevronLeftIcon } from 'lucide-react-native';
import { router } from 'expo-router';

export const SaleHeader: React.FC = () => {
  return (
    <HStack className="items-center mb-2">
      <Pressable onPress={() => router.back()} className="p-2 -ml-2 rounded-lg">
        <Icon as={ChevronLeftIcon} className="w-6 h-6 text-gray-700" />
      </Pressable>
      <Text className="text-xl font-bold text-gray-900 ml-2">Nueva Venta</Text>
    </HStack>
  );
};