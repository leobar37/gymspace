import React from 'react';
import { View, Dimensions } from 'react-native';
import { Modal, ModalBackdrop, ModalContent, ModalHeader, ModalBody, ModalCloseButton } from '@/components/ui/modal';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Icon } from '@/components/ui/icon';
import { Button, ButtonText } from '@/components/ui/button';
import { DownloadIcon, ShareIcon } from 'lucide-react-native';
import { AssetPreview } from './AssetPreview';
import { useAsset } from '../controllers/assets.controller';
import { useAssetPreviewStore } from '../stores/asset-preview.store';

export const AssetPreviewGlobal: React.FC = () => {
  const { isVisible, assetId, hidePreview } = useAssetPreviewStore();
  const { data: asset, isLoading } = useAsset(assetId || '', !!assetId);
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  console.log('[AssetPreviewGlobal] Rendering with:', { isVisible, assetId });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View className="flex-1 items-center justify-center py-20">
          <Text className="text-gray-600 mt-4">Cargando...</Text>
        </View>
      );
    }

    if (!asset) {
      return (
        <View className="flex-1 items-center justify-center py-20">
          <Text className="text-gray-600">No se pudo cargar el archivo</Text>
        </View>
      );
    }

    return (
      <>
        {/* Asset Preview */}
        <View className="flex-1 bg-black">
          <AssetPreview
            asset={asset}
            width={screenWidth}
            height={screenHeight * 0.6}
            resizeMode="contain"
            showLoading={false}
          />
        </View>

        {/* Asset Info */}
        <VStack className="p-4 bg-white border-t border-gray-200">
          <Text className="text-lg font-semibold text-gray-900 mb-2">
            {asset.originalName || 'Archivo sin nombre'}
          </Text>
          
          <HStack className="gap-4">
            <VStack className="flex-1">
              <Text className="text-xs text-gray-500">Tipo</Text>
              <Text className="text-sm text-gray-700">{asset.mimeType || 'Desconocido'}</Text>
            </VStack>
            
            <VStack className="flex-1">
              <Text className="text-xs text-gray-500">Tamaño</Text>
              <Text className="text-sm text-gray-700">
                {asset.size ? formatFileSize(asset.size) : 'Desconocido'}
              </Text>
            </VStack>
            
            <VStack className="flex-1">
              <Text className="text-xs text-gray-500">Fecha</Text>
              <Text className="text-sm text-gray-700">
                {asset.createdAt ? formatDate(asset.createdAt) : 'Desconocida'}
              </Text>
            </VStack>
          </HStack>
        </VStack>
      </>
    );
  };

  return (
    <Modal
      isOpen={isVisible}
      onClose={hidePreview}
      size="full"
    >
      <ModalBackdrop />
      <ModalContent className="flex-1">
        <ModalHeader className="flex-row items-center justify-between p-4 border-b border-gray-200">
          <Text className="text-lg font-semibold text-gray-900">
            Vista previa
          </Text>
          <HStack className="gap-2">
            <Icon as={DownloadIcon} className="w-5 h-5 text-gray-600 opacity-50" />
            <Icon as={ShareIcon} className="w-5 h-5 text-gray-600 opacity-50" />
            <ModalCloseButton />
          </HStack>
        </ModalHeader>
        
        <ModalBody className="flex-1 p-0">
          {renderContent()}
        </ModalBody>
        
        <View className="p-4 bg-white border-t border-gray-200">
          <Button
            variant="outline"
            onPress={hidePreview}
            className="w-full"
          >
            <ButtonText>Cerrar</ButtonText>
          </Button>
        </View>
      </ModalContent>
    </Modal>
  );
};