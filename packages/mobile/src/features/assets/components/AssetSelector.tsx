import React from 'react';
import { View, ActivityIndicator, Dimensions, Pressable, FlatList } from 'react-native';
import { Controller, useFormContext } from 'react-hook-form';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { Icon } from '@/components/ui/icon';
import { ImageIcon } from 'lucide-react-native';
import { SheetManager } from 'react-native-actions-sheet';
import { useAssetsByIds } from '../controllers/assets.controller';
import { AssetPreview } from './AssetPreview';

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
  
  const handleOpenSelector = async (onChange: (value: any) => void) => {
    await SheetManager.show('asset-selector', {
      payload: {
        isMulti: multi,
        selectedAssets: assetIds,
        onSelect: (selectedIds: string[]) => {
          // Pass the value directly based on multi mode
          const newValue = multi
            ? selectedIds
            : selectedIds[0] || null;
          
          onChange(newValue);
        },
      },
    });
  };
  
  const screenWidth = Dimensions.get('window').width;
  const carouselWidth = screenWidth - 32; // Account for padding
  const itemWidth = Math.floor((carouselWidth - 8) / 2); // Width for each item in 2-column grid with gap
  
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
                  <Pressable 
                    onPress={() => handleOpenSelector(onChange)}
                    style={{ width: '100%' }}
                  >
                    <View className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                      <AssetPreview
                        asset={assets[0]}
                        width={carouselWidth}
                        height={192}
                        resizeMode="contain"
                        className="w-full h-full"
                        showLoading={false}
                      />
                    </View>
                  </Pressable>
                ) : (
                  // Multiple assets - show 2x2 grid using FlatList
                  <Pressable 
                    onPress={() => handleOpenSelector(onChange)}
                    style={{ width: '100%' }}
                  >
                    <View className="w-full" pointerEvents="box-only">
                      <FlatList
                        data={assets.slice(0, 4)}
                        renderItem={({ item, index }) => (
                          <View style={{ flex: 1, padding: 4 }}>
                            <View style={{ position: 'relative', aspectRatio: 1 }}>
                              <View 
                                style={{
                                  flex: 1,
                                  borderRadius: 12,
                                  overflow: 'hidden',
                                  backgroundColor: '#f3f4f6'
                                }}
                              >
                                <AssetPreview
                                  asset={item}
                                  width={itemWidth - 8}
                                  height={itemWidth - 8}
                                  resizeMode="cover"
                                  className="w-full h-full"
                                />
                              </View>
                              {/* Show +N overlay on the 4th item if there are more */}
                              {index === 3 && assets.length > 4 && (
                                <View className="absolute inset-0 bg-black/60 rounded-xl items-center justify-center">
                                  <Text className="text-white text-lg font-bold">+{assets.length - 4}</Text>
                                </View>
                              )}
                            </View>
                          </View>
                        )}
                        keyExtractor={(item) => item.id}
                        numColumns={2}
                        scrollEnabled={false}
                        columnWrapperStyle={{ paddingHorizontal: 4 }}
                        contentContainerStyle={{ paddingVertical: 4 }}
                      />
                      <Text className="text-center text-xs text-gray-500 mt-2">
                        {assets.length} archivo{assets.length !== 1 ? 's' : ''} seleccionado{assets.length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </Pressable>
                )}
              </View>
            ) : (
              // No assets - show clickable placeholder
              <Pressable onPress={() => handleOpenSelector(onChange)}>
                <View className="h-48 bg-gray-100 rounded-lg items-center justify-center border-2 border-dashed border-gray-300">
                  <Icon as={ImageIcon} size="xl" className="text-gray-400 mb-2" />
                  <Text className="text-gray-500">No hay archivos seleccionados</Text>
                  <Text className="text-xs text-gray-400 mt-1">Toca para seleccionar o tomar foto</Text>
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
    </>
  );
}