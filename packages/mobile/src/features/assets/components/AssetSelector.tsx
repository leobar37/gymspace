import React from 'react';
import { View, ActivityIndicator, Dimensions, Pressable } from 'react-native';
import { Controller, useFormContext } from 'react-hook-form';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { Icon } from '@/components/ui/icon';
import { ImageIcon } from 'lucide-react-native';
import Carousel from 'react-native-reanimated-carousel';
import { useAssetsStore } from '../stores/assets.store';
import { useAssetsByIds } from '../controllers/assets.controller';
import { AssetPreview } from './AssetPreview';
import { AssetModal } from './AssetModal';

interface AssetSelectorProps {
  name: string;
  multi?: boolean;
  label?: string;
  required?: boolean;
}

export function AssetSelector({
  name,
  multi = false,
  label,
  required = false,
}: AssetSelectorProps) {
  const { control, watch } = useFormContext();
  const { openModal } = useAssetsStore();
  
  // Watch the form value
  const formValue = watch(name);
  
  // Determine the asset IDs based on multi mode
  const assetIds = React.useMemo(() => {
    if (!formValue) return [];
    
    if (multi) {
      // For multi mode, formValue should be an array
      return Array.isArray(formValue) ? formValue : [];
    } else {
      // For single mode, formValue should be a string
      return formValue ? [formValue] : [];
    }
  }, [formValue, multi]);
  
  // Fetch asset data
  const { data: assets, isLoading } = useAssetsByIds(assetIds);
  
  const handleOpenSelector = (onChange: (value: any) => void) => {
    openModal({
      isMulti: multi,
      selectedAssets: assetIds,
      onSelect: (selectedIds) => {
        // Pass the value directly based on multi mode
        const newValue = multi
          ? selectedIds
          : selectedIds[0] || null;
        
        onChange(newValue);
      },
    });
  };
  
  const screenWidth = Dimensions.get('window').width;
  const carouselWidth = screenWidth - 32; // Account for padding
  
  return (
    <>
      <Controller
        control={control}
        name={name}
        rules={{ required: required ? 'Se requiere al menos un archivo' : undefined }}
        render={({ field: { onChange }, fieldState: { error } }) => (
          <VStack space="sm" className="w-full">
            {label && (
              <Text className="text-sm font-medium text-gray-700">{label}</Text>
            )}
            
            {/* Asset Preview Area */}
            {isLoading ? (
              <View className="h-48 bg-gray-100 rounded-lg items-center justify-center">
                <ActivityIndicator size="large" />
              </View>
            ) : assets && assets.length > 0 ? (
              <View className="w-full">
                {assets.length === 1 ? (
                  // Single asset - show directly with click to change
                  <Pressable onPress={() => handleOpenSelector(onChange)}>
                    <View className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                      <AssetPreview
                        asset={assets[0]}
                        width={carouselWidth}
                        height={192}
                        resizeMode="contain"
                        className="rounded-lg"
                      />
                    </View>
                  </Pressable>
                ) : (
                  // Multiple assets - show carousel
                  <View className="w-full h-48">
                    <Carousel
                      loop
                      width={carouselWidth}
                      height={192}
                      autoPlay={false}
                      data={assets}
                      scrollAnimationDuration={1000}
                      renderItem={({ item }) => (
                        <Pressable 
                          onPress={() => handleOpenSelector(onChange)}
                          className="flex-1 mx-1"
                        >
                          <AssetPreview
                            asset={item}
                            width={carouselWidth - 8}
                            height={192}
                            resizeMode="contain"
                            className="rounded-lg"
                          />
                        </Pressable>
                      )}
                    />
                    <Text className="text-center text-xs text-gray-500 mt-1">
                      Desliza para ver los {assets.length} archivos
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              // No assets - show clickable placeholder
              <Pressable onPress={() => handleOpenSelector(onChange)}>
                <View className="h-48 bg-gray-100 rounded-lg items-center justify-center border-2 border-dashed border-gray-300">
                  <Icon as={ImageIcon} size="xl" className="text-gray-400 mb-2" />
                  <Text className="text-gray-500">No hay archivos seleccionados</Text>
                  <Text className="text-xs text-gray-400 mt-1">Toca para seleccionar</Text>
                </View>
              </Pressable>
            )}
            
            {/* Error Message */}
            {error && (
              <Text className="text-xs text-red-500">{error.message}</Text>
            )}
          </VStack>
        )}
      />
      
      {/* Global Asset Modal */}
      <AssetModal />
    </>
  );
}