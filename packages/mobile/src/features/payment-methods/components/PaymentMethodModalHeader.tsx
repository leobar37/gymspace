import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { XIcon } from 'lucide-react-native';

interface PaymentMethodModalHeaderProps {
  title: string;
  onClose: () => void;
}

export function PaymentMethodModalHeader({ title, onClose }: PaymentMethodModalHeaderProps) {
  return (
    <HStack className="justify-between items-center mb-4">
      <Text className="text-lg font-semibold text-gray-900">{title}</Text>
      <Pressable onPress={onClose} className="p-1">
        <Icon as={XIcon} className="text-gray-400" size="md" />
      </Pressable>
    </HStack>
  );
}