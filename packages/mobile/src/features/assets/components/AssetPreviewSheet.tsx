import React from 'react';
import { View, ActivityIndicator, Pressable, Dimensions, ScrollView } from 'react-native';
import ActionSheet, { SheetManager, SheetProps } from 'react-native-actions-sheet';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Icon } from '@/components/ui/icon';
import { Button, ButtonText } from '@/components/ui/button';
import { DownloadIcon, ShareIcon, XIcon, Trash2Icon } from 'lucide-react-native';
import { AssetPreview } from './AssetPreview';
import { useAsset } from '../controllers/assets.controller';
import { formatShortDate } from '@/shared/utils/format';
import { formatFileSize, formatFileType } from '../utils/formatters';

interface AssetPreviewSheetPayload {
  assetId: string;
  onDownload?: (assetId: string) => void;
  onShare?: (assetId: string) => void;
  onDelete?: (assetId: string) => void;
  onClose?: () => void;
}

export const AssetPreviewSheet: React.FC<SheetProps<'asset-preview'>> = ({
  sheetId,
  payload,
}) => {
  const { assetId, onDownload, onShare, onDelete, onClose } = (payload || {}) as AssetPreviewSheetPayload;
  const { data: asset, isLoading, isError } = useAsset(assetId || '', !!assetId);
  
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const previewHeight = Math.min(screenHeight * 0.4, 400); // Max 400px or 40% of screen

  const handleClose = () => {
    SheetManager.hide(sheetId as string);
    onClose?.();
  };

  // Memoize the asset info section
  const assetInfoSection = React.useMemo(() => {
    if (!asset) return null;
    
    return (
      <VStack className="px-4 pb-4" space="md">
        {/* File Name */}
        <Text className="text-lg font-semibold text-gray-900" numberOfLines={2}>
          {asset.originalName || 'Archivo sin nombre'}
        </Text>
        
        {/* File Details */}
        <HStack className="gap-4">
          <VStack className="flex-1">
            <Text className="text-xs text-gray-500 mb-1">Tipo</Text>
            <Text className="text-sm text-gray-700" numberOfLines={1}>
              {formatFileType(asset.mimeType)}
            </Text>
          </VStack>
          
          <VStack className="flex-1">
            <Text className="text-xs text-gray-500 mb-1">Tamaño</Text>
            <Text className="text-sm text-gray-700">
              {formatFileSize((asset as any).size || 0)}
            </Text>
          </VStack>
          
          <VStack className="flex-1">
            <Text className="text-xs text-gray-500 mb-1">Fecha</Text>
            <Text className="text-sm text-gray-700">
              {asset.createdAt ? formatShortDate(asset.createdAt) : 'Desconocida'}
            </Text>
          </VStack>
        </HStack>

        {/* Action Buttons */}
        {(onDownload || onShare || onDelete) && (
          <VStack space="md" className="mt-2">
            <HStack className="gap-3">
              {onDownload && (
                <Button
                  variant="outline"
                  size="md"
                  onPress={() => onDownload(assetId!)}
                  className="flex-1"
                >
                  <HStack space="sm" className="items-center">
                    <Icon as={DownloadIcon} className="w-4 h-4" />
                    <ButtonText>Descargar</ButtonText>
                  </HStack>
                </Button>
              )}
              
              {onShare && (
                <Button
                  variant="outline"
                  size="md"
                  onPress={() => onShare(assetId!)}
                  className="flex-1"
                >
                  <HStack space="sm" className="items-center">
                    <Icon as={ShareIcon} className="w-4 h-4" />
                    <ButtonText>Compartir</ButtonText>
                  </HStack>
                </Button>
              )}
            </HStack>
            
            {onDelete && (
              <Button
                variant="outline"
                size="md"
                onPress={() => onDelete(assetId!)}
                className="w-full border-red-500"
              >
                <HStack space="sm" className="items-center">
                  <Icon as={Trash2Icon} className="w-4 h-4 text-red-600" />
                  <ButtonText className="text-red-600">Eliminar</ButtonText>
                </HStack>
              </Button>
            )}
          </VStack>
        )}
      </VStack>
    );
  }, [asset, assetId, onDownload, onShare, onDelete]);

  const renderContent = () => {
    // Loading state
    if (isLoading) {
      return (
        <View className="h-64 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
          <Text className="text-gray-600 mt-4">Cargando archivo...</Text>
        </View>
      );
    }

    // Error state
    if (isError || !asset) {
      return (
        <VStack className="h-64 items-center justify-center px-6" space="md">
          <Icon as={XIcon} size="xl" className="text-red-500" />
          <VStack space="sm" className="items-center">
            <Text className="text-gray-900 font-medium text-center">
              Error al cargar el archivo
            </Text>
            <Text className="text-gray-500 text-sm text-center">
              Por favor, intenta nuevamente
            </Text>
          </VStack>
          <Button variant="outline" size="sm" onPress={handleClose}>
            <ButtonText>Cerrar</ButtonText>
          </Button>
        </VStack>
      );
    }

    // Success state
    return (
      <>
        {/* Preview Section */}
        <View 
          className="bg-gray-50 rounded-t-lg overflow-hidden"
          style={{ height: previewHeight }}
        >
          <AssetPreview
            asset={asset}
            width={screenWidth}
            height={previewHeight}
            resizeMode="contain"
            showLoading={false}
            className="w-full h-full"
          />
        </View>

        {/* Asset Information */}
        {assetInfoSection}
      </>
    );
  };

  return (
    <ActionSheet
      id={sheetId as string}
      gestureEnabled
      indicatorStyle={{
        backgroundColor: '#D1D5DB',
        width: 36,
        height: 4,
      }}
      containerStyle={{
        backgroundColor: 'white',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
      }}
    >
      {/* Header */}
      <HStack className="px-4 py-3 border-b border-gray-200 items-center justify-between">
        <Text className="text-base font-semibold text-gray-900">
          Vista previa
        </Text>
        <Pressable
          onPress={handleClose}
          className="p-2 -mr-2 rounded-lg active:bg-gray-100"
        >
          <Icon as={XIcon} className="w-5 h-5 text-gray-600" />
        </Pressable>
      </HStack>

      {/* Content */}
      <ScrollView className="pb-safe" showsVerticalScrollIndicator={false}>
        {renderContent()}
      </ScrollView>
    </ActionSheet>
  );
};