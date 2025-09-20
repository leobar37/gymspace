import React, { useCallback, useMemo, useRef } from 'react';
import { View, ActivityIndicator, Alert, Pressable, RefreshControl } from 'react-native';
import { BottomSheetFlatList } from '@gymspace/sheet';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Fab, FabIcon } from '@/components/ui/fab';
import {
  Plus as PlusIcon,
  Check as CheckIcon,
  Image as ImageIcon,
  Camera as CameraIcon,
  Images as GalleryIcon,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import {
  useAllAssets,
  useDeleteAsset,
  useUploadAsset,
  assetsKeys,
} from '../../controllers/assets.controller';
import { SheetManager } from '@gymspace/sheet';
import * as ImagePicker from 'expo-image-picker';
import { useQueryClient } from '@tanstack/react-query';
import { AssetPreview } from '../AssetPreview';
import type { AssetResponseDto } from '@gymspace/sdk';
import type { AssetSelectorRouteContext } from '../AssetSelectorSheet';

interface AssetListRouteProps {
  route: {
    params: AssetSelectorRouteContext;
  };
}

interface FileUpload {
  uri: string;
  type: string;
  name: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Separate component for asset item to properly use hooks
interface AssetItemProps {
  item: AssetResponseDto;
  isSelected: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

const AssetItem: React.FC<AssetItemProps> = React.memo(
  ({ item, isSelected, onPress, onLongPress }) => {
    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: withSpring(isSelected ? 0.95 : 1) }],
      };
    }, [isSelected]);

    return (
      <AnimatedPressable
        style={[animatedStyle, { flex: 1 / 3, padding: 4 }]}
        onPress={onPress}
        onLongPress={onLongPress}
      >
        <View className="aspect-square">
          <View
            className={`flex-1 border-2 rounded-xl overflow-hidden bg-gray-100 ${
              isSelected ? 'border-primary-500' : 'border-gray-200'
            }`}
          >
            <AssetPreview asset={item} size="full" resizeMode="cover" className="w-full h-full" />
          </View>

          {/* Selection indicator */}
          {isSelected && (
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(200)}
              className="absolute top-2 right-2 bg-primary-500 rounded-xl p-1 shadow-lg"
            >
              <Icon as={CheckIcon} className="text-white" size="xs" />
            </Animated.View>
          )}
        </View>
      </AnimatedPressable>
    );
  },
);

export const AssetListRoute: React.FC<AssetListRouteProps> = ({ route }) => {
  const context = route.params;
  const { data: assets, isLoading, refetch, isRefetching } = useAllAssets(true);
  const deleteAssetMutation = useDeleteAsset();
  const uploadAssetMutation = useUploadAsset();
  const queryClient = useQueryClient();
  const [showUploadOptions, setShowUploadOptions] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);

  // Ref to track component mount status for memory leak prevention
  const isMountedRef = useRef(true);

  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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

  // Reusable delete confirmation function
  const showDeleteConfirmation = useCallback(
    (assetId: string, assetName?: string) => {
      Alert.alert(
        'Eliminar Archivo',
        `¿Estás seguro de que quieres eliminar ${assetName || 'este archivo'}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              if (!isMountedRef.current) return;

              try {
                await deleteAssetMutation.mutateAsync(assetId);

                if (!isMountedRef.current) return;

                // Remove from selection if it was selected
                if (context.selectedAssets.includes(assetId)) {
                  context.setSelectedAssets(context.selectedAssets.filter((id) => id !== assetId));
                }
                refetch();
              } catch (error) {
                if (isMountedRef.current) {
                  Alert.alert('Error', 'No se pudo eliminar el archivo');
                }
              }
            },
          },
        ],
      );
    },
    [deleteAssetMutation, context, refetch, isMountedRef],
  );

  // Create properly typed file upload function
  const createFileUpload = useCallback(
    (asset: ImagePicker.ImagePickerAsset): FileUpload => ({
      uri: asset.uri,
      type: asset.type === 'video' ? 'video/mp4' : 'image/jpeg',
      name: asset.fileName || `asset_${Date.now()}.jpg`,
    }),
    [],
  );

  const handleAddAsset = useCallback(() => {
    setShowUploadOptions(true);
  }, []);

  const handleImagePickerOption = useCallback(
    async (type: 'camera' | 'gallery') => {
      setShowUploadOptions(false);
      setIsUploading(true);

      try {
        const options: ImagePicker.ImagePickerOptions = {
          mediaTypes: 'Images' as ImagePicker.MediaType,
          allowsEditing: false,
          quality: 0.8,
          allowsMultipleSelection: type === 'gallery' ? context.isMulti : false,
        };

        let result: ImagePicker.ImagePickerResult;
        if (type === 'camera') {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (!permission.granted) {
            Alert.alert('Error', 'Se necesitan permisos de cámara');
            if (isMountedRef.current) setIsUploading(false);
            return;
          }
          result = await ImagePicker.launchCameraAsync(options);
        } else {
          const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!permission.granted) {
            Alert.alert('Error', 'Se necesitan permisos de galería');
            if (isMountedRef.current) setIsUploading(false);
            return;
          }
          result = await ImagePicker.launchImageLibraryAsync(options);
        }

        if (!isMountedRef.current) return;

        if (!result.canceled && result.assets.length > 0) {
          const uploadedIds: string[] = [];

          for (const asset of result.assets) {
            if (!isMountedRef.current) break;

            const file = createFileUpload(asset);

            const uploadedAsset = await uploadAssetMutation.mutateAsync({
              file: file as any as File, // Type assertion for SDK compatibility
              metadata: {
                width: asset.width,
                height: asset.height,
                duration:
                  'duration' in asset
                    ? (asset as unknown as { duration?: number }).duration
                    : undefined,
              },
            });

            uploadedIds.push(uploadedAsset.id);
          }

          if (!isMountedRef.current) return;

          // Refresh the assets list
          await queryClient.invalidateQueries({ queryKey: assetsKeys.all });

          // Add to selection if needed
          if (context.isMulti) {
            context.setSelectedAssets([...context.selectedAssets, ...uploadedIds]);
          } else {
            context.setSelectedAssets(uploadedIds);
          }

          refetch();
        }
      } catch (error) {
        console.error('Error handling image picker:', error);
        if (isMountedRef.current) {
          Alert.alert('Error', 'No se pudo procesar la imagen');
        }
      } finally {
        if (isMountedRef.current) {
          setIsUploading(false);
        }
      }
    },
    [context, uploadAssetMutation, queryClient, refetch, createFileUpload, isMountedRef],
  );

  // Remove duplicate delete function - using showDeleteConfirmation instead

  const handleAssetPress = useCallback(
    (asset: AssetResponseDto) => {
      context.toggleAssetSelection(asset.id);
    },
    [context],
  );

  const handleAssetLongPress = useCallback(
    async (asset: AssetResponseDto) => {
      // Show preview with delete option
      SheetManager.show('asset-preview', {
        assetId: asset.id,
        onDelete: (assetId: string) => {
          SheetManager.hide('asset-preview');
          showDeleteConfirmation(assetId, asset.originalName);
        },
      });
    },
    [showDeleteConfirmation],
  );

  const handleConfirmSelection = useCallback(() => {
    if (context.selectedAssets.length > 0) {
      context.onConfirm();
    }
  }, [context]);

  const renderAssetItem = useCallback(
    ({ item }: { item: AssetResponseDto }) => {
      const isSelected = context.selectedAssets.includes(item.id);

      return (
        <AssetItem
          item={item}
          isSelected={isSelected}
          onPress={() => handleAssetPress(item)}
          onLongPress={() => handleAssetLongPress(item)}
        />
      );
    },
    [context.selectedAssets, handleAssetPress, handleAssetLongPress],
  );

  const ListEmptyComponent = useCallback(
    () => (
      <View className="flex-1 items-center justify-center py-20">
        <Icon as={ImageIcon} size="xl" className="text-gray-300 mb-4" />
        <Text className="text-gray-500 text-base mb-2">No hay archivos disponibles</Text>
        <Text className="text-gray-400 text-sm mb-6">Sube tu primer archivo</Text>
      </View>
    ),
    [],
  );

  const ListHeaderComponent = useCallback(() => null, []); // Will be replaced with floating button

  const keyExtractor = useCallback((item: AssetResponseDto) => item.id, []);

  const floatingUploadButtonBottom = useMemo(
    () => (context.isMulti && context.selectedAssets.length > 0 ? 80 : 20),
    [context.isMulti, context.selectedAssets.length],
  );

  const uploadOptionsMenuBottom = useMemo(
    () => (context.isMulti && context.selectedAssets.length > 0 ? 150 : 90),
    [context.isMulti, context.selectedAssets.length],
  );

  const dynamicPaddingBottom = useMemo(
    () => (context.isMulti && context.selectedAssets.length > 0 ? 100 : 80),
    [context.isMulti, context.selectedAssets.length],
  );

  if (isLoading && !assets) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="text-gray-600 mt-4">Cargando archivos...</Text>
      </View>
    );
  }

  return (
    <>
      <BottomSheetFlatList
        data={sortedAssets}
        renderItem={renderAssetItem}
        keyExtractor={keyExtractor}
        numColumns={3}
        columnWrapperStyle={{ paddingHorizontal: 8 }}
        contentContainerStyle={{
          paddingTop: 12,
          flexGrow: 1,
          height: '100%',
        }}
        ListEmptyComponent={ListEmptyComponent}
        ListHeaderComponent={sortedAssets.length > 0 ? ListHeaderComponent : null}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#6366f1" />
        }
      />

      {/* Floating upload button */}
      <Fab
        size="lg"
        placement="bottom right"
        onPress={handleAddAsset}
        style={{ bottom: floatingUploadButtonBottom }}
      >
        <FabIcon as={PlusIcon} />
      </Fab>

      {/* Floating confirm button for multi selection */}
      {context.isMulti && context.selectedAssets.length > 0 && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          className="absolute bottom-5 left-5 right-5"
        >
          <Button
            variant="solid"
            size="lg"
            onPress={handleConfirmSelection}
            className="w-full shadow-lg"
          >
            <ButtonText>
              Confirmar {context.selectedAssets.length} archivo
              {context.selectedAssets.length !== 1 ? 's' : ''}
            </ButtonText>
          </Button>
        </Animated.View>
      )}

      {/* Upload options modal */}
      {showUploadOptions && (
        <>
          {/* Backdrop */}
          <Pressable
            className="absolute inset-0 bg-black/50"
            onPress={() => setShowUploadOptions(false)}
          />

          {/* Options menu */}
          <Animated.View
            entering={FadeIn.duration(200)}
            className="absolute right-5 bg-white rounded-xl shadow-xl p-2"
            style={{ bottom: uploadOptionsMenuBottom }}
            pointerEvents="box-none"
          >
            <Pressable
              onPress={() => handleImagePickerOption('camera')}
              className="flex-row items-center py-3 px-4"
            >
              <Icon as={CameraIcon} className="text-gray-700 mr-3" size="md" />
              <Text className="text-gray-700">Tomar Foto</Text>
            </Pressable>
            <View className="h-px bg-gray-200" />
            <Pressable
              onPress={() => handleImagePickerOption('gallery')}
              className="flex-row items-center py-3 px-4"
            >
              <Icon as={GalleryIcon} className="text-gray-700 mr-3" size="md" />
              <Text className="text-gray-700">Seleccionar de Galería</Text>
            </Pressable>
          </Animated.View>
        </>
      )}

      {/* Upload loading indicator */}
      {isUploading && (
        <View className="absolute inset-0 bg-black/50 items-center justify-center">
          <View className="bg-white rounded-xl p-5 items-center">
            <ActivityIndicator size="large" color="#6366f1" />
            <Text className="text-gray-700 mt-3">Subiendo imagen...</Text>
          </View>
        </View>
      )}
    </>
  );
};
