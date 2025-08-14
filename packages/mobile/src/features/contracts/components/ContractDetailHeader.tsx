import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { Icon } from '@/components/ui/icon';
import { ArrowLeft, MoreVertical } from 'lucide-react-native';
import type { ContractResponseDto } from '@gymspace/sdk';

interface ContractDetailHeaderProps {
  contract: ContractResponseDto;
  onMenuPress: () => void;
}

export const ContractDetailHeader: React.FC<ContractDetailHeaderProps> = ({ 
  contract, 
  onMenuPress 
}) => {
  const router = useRouter();

  return (
    <HStack className="p-4 items-center justify-between border-b border-gray-200">
      <HStack className="flex-1 items-center">
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center"
        >
          <Icon as={ArrowLeft} size="md" className="text-gray-700 mr-2" />
          <Text className="text-base text-blue-600">Contratos</Text>
        </Pressable>
      </HStack>
      
      <View className="flex-1 items-center">
        <Text className="text-lg font-semibold">Contrato #{contract.contractNumber}</Text>
      </View>
      
      <View className="flex-1 items-end">
        <Pressable
          onPress={onMenuPress}
          className="p-2"
        >
          <Icon as={MoreVertical} size="md" className="text-gray-700" />
        </Pressable>
      </View>
    </HStack>
  );
};