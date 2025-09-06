import React from 'react';
import {
  View,
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable,
  RefreshControl,
} from 'react-native';
import { FlatList, ScrollView } from 'react-native-actions-sheet';
import { useMultiScreenContext } from '@/components/ui/multi-screen';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import {
  Plus as PlusIcon,
  Check as CheckIcon,
  Image as ImageIcon,
  Trash2 as TrashIcon,
  Camera as CameraIcon,
  Images as GalleryIcon,
} from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useAllAssets, useDeleteAsset } from '../../controllers/assets.controller';
import { SheetManager } from 'react-native-actions-sheet';
import * as ImagePicker from 'expo-image-picker';
import { AssetPreview } from '../AssetPreview';
import type { AssetResponseDto } from '@gymspace/sdk';
import type { AssetSelectorRouteContext } from '../AssetSelectorSheet';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_SIZE = (SCREEN_WIDTH - 48) / 3; // 3 columns with padding

interface AssetListRouteProps {
  route: {
    params: AssetSelectorRouteContext;
  };
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Separate component for asset item to properly use hooks
interface AssetItemProps {
  item: AssetResponseDto;
  isSelected: boolean;
  isSelectionMode: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onDelete: () => void;
}

const AssetItem: React.FC<AssetItemProps> = ({ 
  item, 
  isSelected, 
  isSelectionMode, 
  onPress, 
  onLongPress,
  onDelete 
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(isSelected ? 0.95 : 1) }],
    };
  });

  return (
    <AnimatedPressable
      style={[{ flex: 1, padding: 4 }, animatedStyle]}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <View
        style={{
          width: '100%',
          aspectRatio: 1,
          position: 'relative',
        }}
      >
        <View
          style={{
            flex: 1,
            borderWidth: 2,
            borderRadius: 12,
            borderColor: isSelected ? '#6366f1' : '#e5e7eb',
            overflow: 'hidden',
            backgroundColor: '#f3f4f6',
          }}
        >
          <AssetPreview
            asset={item}
            size="full"
            resizeMode="cover"
            className="w-full h-full"
          />
        </View>
        
        {/* Selection indicator */}
        {isSelected && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: '#6366f1',
              borderRadius: 12,
              padding: 4,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 5,
            }}
          >
            <Icon as={CheckIcon} className="text-white" size="xs" />
          </Animated.View>
        )}

        {/* No delete button here - will be shown in preview */}
      </View>
    </AnimatedPressable>
  );
};

export const AssetListRoute: React.FC<AssetListRouteProps> = ({ route }) => {
  const context = route.params;
  const { router } = useMultiScreenContext();
  const { data: assets, isLoading, refetch, isRefetching } = useAllAssets(true);
  const deleteAssetMutation = useDeleteAsset();
  const [isSelectionMode, setIsSelectionMode] = React.useState(false);
  const [showUploadOptions, setShowUploadOptions] = React.useState(false);

  // Sort assets to show selected ones first
  const sortedAssets = React.useMemo(() => {
    if (!assets) return [];
    return [...assets].sort((a, b) => {
      const aSelected = context.selectedAssets.includes(a.id);
      const bSelected = context.selectedAssets.includes(b.id);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [assets, context.selectedAssets]);

  const handleAddAsset = () => {
    setShowUploadOptions(true);
  };

  const handleImagePickerOption = async (type: 'camera' | 'gallery') => {
    setShowUploadOptions(false);
    
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
      allowsMultipleSelection: context.isMulti,
    };

    let result;
    if (type === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Error', 'Se necesitan permisos de cámara');
        return;
      }
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Error', 'Se necesitan permisos de galería');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (!result.canceled && result.assets.length > 0) {
      router.navigate('upload', {
        props: {
          routeContext: {
            ...context,
            uploadAssets: result.assets,
          }
        }
      });
    }
  };

  const handleDeleteAsset = (assetId: string, assetName?: string) => {
    Alert.alert(
      'Eliminar Archivo',
      `¿Estás seguro de que quieres eliminar ${assetName || 'este archivo'}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAssetMutation.mutateAsync(assetId);
              // Remove from selection if it was selected
              if (context.selectedAssets.includes(assetId)) {
                context.setSelectedAssets(
                  context.selectedAssets.filter((id) => id !== assetId)
                );
              }
              refetch();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el archivo');
            }
          },
        },
      ]
    );
  };

  const handleAssetPress = (asset: AssetResponseDto) => {
    context.toggleAssetSelection(asset.id);
  };

  const handleAssetLongPress = async (asset: AssetResponseDto) => {
    // Show preview with delete option
    await SheetManager.show('asset-preview', {
      payload: {
        assetId: asset.id,
        onDelete: (assetId: string) => {
          SheetManager.hide('asset-preview');
          Alert.alert(
            'Eliminar Archivo',
            `¿Estás seguro de que quieres eliminar ${asset.originalName || 'este archivo'}?`,
            [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Eliminar',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await deleteAssetMutation.mutateAsync(assetId);
                    // Remove from selection if it was selected
                    if (context.selectedAssets.includes(assetId)) {
                      context.setSelectedAssets(
                        context.selectedAssets.filter((id) => id !== assetId)
                      );
                    }
                    refetch();
                  } catch (error) {
                    Alert.alert('Error', 'No se pudo eliminar el archivo');
                  }
                },
              },
            ]
          );
        },
      },
    });
  };

  const handleConfirmSelection = () => {
    if (context.selectedAssets.length > 0) {
      context.onConfirm();
    }
  };

  const renderAssetItem = ({ item }: { item: AssetResponseDto }) => {
    const isSelected = context.selectedAssets.includes(item.id);

    return (
      <AssetItem
        item={item}
        isSelected={isSelected}
        isSelectionMode={isSelectionMode}
        onPress={() => handleAssetPress(item)}
        onLongPress={() => handleAssetLongPress(item)}
        onDelete={() => handleDeleteAsset(item.id, item.originalName)}
      />
    );
  };

  const ListEmptyComponent = () => (
    <View className="flex-1 items-center justify-center py-20">
      <Icon as={ImageIcon} size="xl" className="text-gray-300 mb-4" />
      <Text className="text-gray-500 text-base mb-2">No hay archivos disponibles</Text>
      <Text className="text-gray-400 text-sm mb-6">Sube tu primer archivo</Text>
      <Button variant="solid" size="md" onPress={handleAddAsset}>
        <HStack space="sm" className="items-center">
          <Icon as={PlusIcon} className="text-white" size="sm" />
          <ButtonText>Subir Archivo</ButtonText>
        </HStack>
      </Button>
    </View>
  );

  const ListHeaderComponent = () => null; // Will be replaced with floating button

  if (isLoading && !assets) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="text-gray-600 mt-4">Cargando archivos...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={sortedAssets}
        renderItem={renderAssetItem}
        keyExtractor={(item) => item.id}
        numColumns={3}
        columnWrapperStyle={{ paddingHorizontal: 12 }}
        contentContainerStyle={{ 
          paddingBottom: 100, 
          paddingTop: 12,
          flexGrow: 1,
        }}
        ListEmptyComponent={ListEmptyComponent}
        ListHeaderComponent={sortedAssets.length > 0 ? ListHeaderComponent : null}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#6366f1"
          />
        }
      />

      {/* Floating upload button */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: context.isMulti && context.selectedAssets.length > 0 ? 80 : 20,
          right: 20,
        }}
      >
        <Pressable
          onPress={handleAddAsset}
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: '#6366f1',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
          }}
        >
          <Icon as={PlusIcon} className="text-white" size="lg" />
        </Pressable>
      </Animated.View>

      {/* Floating confirm button for multi selection */}
      {context.isMulti && context.selectedAssets.length > 0 && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            right: 20,
          }}
        >
          <Button
            variant="solid"
            size="lg"
            onPress={handleConfirmSelection}
            className="w-full shadow-lg"
          >
            <ButtonText>
              Confirmar {context.selectedAssets.length} archivo{context.selectedAssets.length !== 1 ? 's' : ''}
            </ButtonText>
          </Button>
        </Animated.View>
      )}

      {/* Upload options modal */}
      {showUploadOptions && (
        <Pressable
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
          onPress={() => setShowUploadOptions(false)}
        >
          <Animated.View
            entering={FadeIn.duration(200)}
            style={{
              position: 'absolute',
              bottom: context.isMulti && context.selectedAssets.length > 0 ? 150 : 90,
              right: 20,
              backgroundColor: 'white',
              borderRadius: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 5,
              padding: 8,
            }}
          >
            <Pressable
              onPress={() => handleImagePickerOption('camera')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                paddingHorizontal: 16,
              }}
            >
              <Icon as={CameraIcon} className="text-gray-700 mr-3" size="md" />
              <Text className="text-gray-700">Tomar Foto</Text>
            </Pressable>
            <View style={{ height: 1, backgroundColor: '#E5E7EB' }} />
            <Pressable
              onPress={() => handleImagePickerOption('gallery')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                paddingHorizontal: 16,
              }}
            >
              <Icon as={GalleryIcon} className="text-gray-700 mr-3" size="md" />
              <Text className="text-gray-700">Seleccionar de Galería</Text>
            </Pressable>
          </Animated.View>
        </Pressable>
      )}
    </View>
  );
};