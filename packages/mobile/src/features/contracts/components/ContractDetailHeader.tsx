import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import type { Contract } from '@gymspace/sdk';
import { useRouter } from 'expo-router';
import { MoreVertical } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

interface ContractDetailHeaderProps {
  contract: Contract;
  onMenuPress?: () => void;
}

export const ContractDetailHeader: React.FC<ContractDetailHeaderProps> = ({
  contract,
  onMenuPress,
}) => {
  const router = useRouter();

  return (
    <HStack className="p-4 items-center justify-between border-b border-gray-200">
      <View className="flex-1 items-end">
        {onMenuPress && (
          <Pressable onPress={onMenuPress} className="p-2">
            <Icon as={MoreVertical} size="md" className="text-gray-700" />
          </Pressable>
        )}
      </View>
    </HStack>
  );
};
