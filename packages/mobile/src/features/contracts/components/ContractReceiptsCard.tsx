import { Card } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { PreviewFile } from '@/features/files/components/FilePreview';
import { GlobalFileModalById } from '@/features/files/components/GlobalFileModal';
import type { Contract } from '@gymspace/sdk';
import { Eye } from 'lucide-react-native';
import React, { useState } from 'react';
import { View } from 'react-native';
import { AnimatedTouchableOpacity } from '@/components/ui/animated-touchable-opacity';
interface ContractReceiptsCardProps {
  contract: Contract;
}

export const ContractReceiptsCard: React.FC<ContractReceiptsCardProps> = ({ contract }) => {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  if (!contract.receiptIds || contract.receiptIds.length === 0) {
    return null;
  }

  const handleFilePress = (fileId: string) => {
    setSelectedFileId(fileId);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedFileId(null);
  };

  return (
    <>
      <Card className="p-4">
        <Heading size="md" className="mb-4">
          Recibos adjuntos
        </Heading>
        <VStack className="gap-3">
          {contract.receiptIds.map((fileId: string, index: number) => (
            <HStack
              key={index}
              className="items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 active:bg-gray-100"
            >
              <HStack className="items-center flex-1 gap-3">
                <View className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200">
                  <PreviewFile fileId={fileId} width={48} height={48} resizeMode="cover" />
                </View>
                <VStack className="flex-1">
                  <Text className="text-sm font-medium text-gray-900">Recibo {index + 1}</Text>
                  <Text className="text-xs text-gray-500">Toca para ver en pantalla completa</Text>
                </VStack>
              </HStack>
              <AnimatedTouchableOpacity
                onPress={() => {
                  console.log('lcilasas');
                  handleFilePress(fileId);
                }}
                activeOpacity={0.7}
              >
                <View className="bg-blue-50 p-2 rounded-full">
                  <Icon as={Eye} size="sm" className="text-blue-600" />
                </View>
              </AnimatedTouchableOpacity>
            </HStack>
          ))}
        </VStack>
      </Card>

      {/* File Preview Modal */}
      <GlobalFileModalById
        fileId={selectedFileId}
        visible={isModalVisible}
        onClose={handleCloseModal}
      />
    </>
  );
};
