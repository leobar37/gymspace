import React from 'react';
import { View, ScrollView, Dimensions, Pressable } from 'react-native';
import { useMultiScreenContext } from '@/components/ui/multi-screen';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Icon } from '@/components/ui/icon';
import { CheckCircle2, X as CloseIcon } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useAssetsByIds } from '../../controllers/assets.controller';
import { AssetPreview } from '../AssetPreview';
import { formatFileSize, formatFileType } from '../../utils/formatters';
import { formatShortDate } from '@/shared/utils/format';
import type { AssetSelectorRouteContext } from '../AssetSelectorSheet';

interface AssetSelectionRouteProps {
  route: {
    params: AssetSelectorRouteContext;
  };
}

export const AssetSelectionRoute: React.FC<AssetSelectionRouteProps> = ({ route }) => {
  const { router } = useMultiScreenContext();
  const context = route.params;
  const { data: selectedAssets, isLoading } = useAssetsByIds(context.selectedAssets);

  const handleRemoveAsset = (assetId: string) => {
    const newSelection = context.selectedAssets.filter((id) => id !== assetId);
    context.setSelectedAssets(newSelection);

    // If no assets left, go back to list
    if (newSelection.length === 0) {
      router.goBack();
    }
  };

  const handleConfirm = () => {
    context.onConfirm();
  };

  const handleCancel = () => {
    router.goBack();
  };

  if (isLoading || !selectedAssets) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <Text className="text-gray-600">Cargando selección...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Header */}
        <Animated.View entering={FadeIn.duration(300)} className="items-center py-6 px-4">
          <View className="bg-green-100 rounded-full p-4 mb-4">
            <Icon as={CheckCircle2} size="xl" className="text-green-600" />
          </View>
          <Text className="text-xl font-semibold text-gray-900">
            {context.isMulti
              ? `${selectedAssets.length} archivos seleccionados`
              : 'Archivo seleccionado'}
          </Text>
          <Text className="text-sm text-gray-500 mt-1">Revisa tu selección antes de confirmar</Text>
        </Animated.View>

        {/* Selected Assets List */}
        <VStack space="md" className="px-4">
          {selectedAssets.map((asset, index) => (
            <Animated.View key={asset.id} entering={FadeIn.duration(300).delay(index * 100)}>
              <View className="bg-gray-50 rounded-xl p-3">
                <HStack space="md" className="items-start">
                  {/* Preview Thumbnail */}
                  <View className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200">
                    <AssetPreview
                      asset={asset}
                      width={80}
                      height={80}
                      resizeMode="cover"
                      className="w-full h-full"
                    />
                  </View>

                  {/* Asset Info */}
                  <VStack className="flex-1" space="xs">
                    <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>
                      {asset.originalName || 'Sin nombre'}
                    </Text>

                    <HStack space="md">
                      <Text className="text-xs text-gray-500">
                        {formatFileType(asset.mimeType)}
                      </Text>
                      <Text className="text-xs text-gray-500">{formatFileSize((asset as any).size || 0)}</Text>
                    </HStack>

                    <Text className="text-xs text-gray-400">
                      {asset.createdAt ? formatShortDate(asset.createdAt) : 'Fecha desconocida'}
                    </Text>
                  </VStack>

                  {/* Remove Button */}
                  {context.isMulti && (
                    <Pressable
                      onPress={() => handleRemoveAsset(asset.id)}
                      className="p-2 rounded-lg active:bg-gray-200"
                    >
                      <Icon as={CloseIcon} size="sm" className="text-gray-500" />
                    </Pressable>
                  )}
                </HStack>
              </View>
            </Animated.View>
          ))}
        </VStack>

        {/* Add More Button (for multi-selection) */}
        {context.isMulti && (
          <View className="px-4 mt-4">
            <Button variant="outline" size="md" onPress={() => router.goBack()} className="w-full">
              <ButtonText>Agregar más archivos</ButtonText>
            </Button>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 pb-safe">
        <HStack space="sm" className="w-full">
          <Button variant="outline" size="lg" onPress={handleCancel} className="flex-1">
            <ButtonText>Cancelar</ButtonText>
          </Button>
          <Button variant="solid" size="lg" onPress={handleConfirm} className="flex-1">
            <ButtonText>Confirmar</ButtonText>
          </Button>
        </HStack>
      </View>
    </View>
  );
};
