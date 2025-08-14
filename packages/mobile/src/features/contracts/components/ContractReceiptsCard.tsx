import React from 'react';
import { View } from 'react-native';
import { Card } from '@/components/ui/card';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Pressable } from '@/components/ui/pressable';
import { Icon } from '@/components/ui/icon';
import { Eye } from 'lucide-react-native';
import { AssetPreview, useAssetPreviewStore } from '@/features/assets';
import type { ContractResponseDto } from '@gymspace/sdk';

interface ContractReceiptsCardProps {
  contract: ContractResponseDto;
}

export const ContractReceiptsCard: React.FC<ContractReceiptsCardProps> = ({ contract }) => {
  const { showPreview } = useAssetPreviewStore();

  if (!contract.receiptIds || contract.receiptIds.length === 0) {
    return null;
  }

  return (
    <Card className="p-4">
      <Heading size="md" className="mb-4">Recibos adjuntos</Heading>
      <VStack className="gap-3">
        {contract.receiptIds.map((assetId: string, index: number) => (
          <Pressable
            key={assetId}
            onPress={() => showPreview(assetId)}
          >
            <HStack className="items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 active:bg-gray-100">
              <HStack className="items-center flex-1 gap-3">
                <View className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200">
                  <AssetPreview
                    assetId={assetId}
                    size="small"
                    resizeMode="cover"
                  />
                </View>
                <VStack className="flex-1">
                  <Text className="text-sm font-medium text-gray-900">
                    Recibo {index + 1}
                  </Text>
                  <Text className="text-xs text-gray-500">
                    Toca para ver en pantalla completa
                  </Text>
                </VStack>
              </HStack>
              <View className="bg-blue-50 p-2 rounded-full">
                <Icon as={Eye} size="sm" className="text-blue-600" />
              </View>
            </HStack>
          </Pressable>
        ))}
      </VStack>
    </Card>
  );
};