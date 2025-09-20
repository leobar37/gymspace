import React, { useCallback, useMemo, useRef } from 'react';
import {
  View,
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { BottomSheetFlatList } from '@gymspace/sheet';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
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

// Theme colors
const COLORS = {
  primary: '#6366f1',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
  },
  white: '#ffffff',
  black: '#000000',
} as const;

// Optimized styles object
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  flatListContent: {
    paddingBottom: 100,
    paddingTop: 12,
    flexGrow: 1,
  },
  columnWrapper: {
    paddingHorizontal: 12,
  },
  assetItemContainer: {
    flex: 1,
    padding: 4,
  },
  assetItemView: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
  },
  assetItemBorder: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.gray[100],
  },
  selectedBorder: {
    borderColor: COLORS.primary,
  },
  unselectedBorder: {
    borderColor: COLORS.gray[200],
  },
  selectionIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  confirmButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  uploadOptionsMenu: {
    position: 'absolute',
    right: 20,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    padding: 8,
  },
  uploadOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  uploadOptionDivider: {
    height: 1,
    backgroundColor: COLORS.gray[200],
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingContent: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
});

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

    const borderStyle = useMemo(
      () => [styles.assetItemBorder, isSelected ? styles.selectedBorder : styles.unselectedBorder],
      [isSelected],
    );

    return (
      <AnimatedPressable
        style={[styles.assetItemContainer, animatedStyle]}
        onPress={onPress}
        onLongPress={onLongPress}
      >
        <View style={styles.assetItemView}>
          <View style={borderStyle}>
            <AssetPreview asset={item} size="full" resizeMode="cover" className="w-full h-full" />
          </View>

          {/* Selection indicator */}
          {isSelected && (
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(200)}
              style={styles.selectionIndicator}
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
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
              file: file as File, // Type assertion for SDK compatibility
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
      await SheetManager.show('asset-preview', {
        payload: {
          assetId: asset.id,
          onDelete: (assetId: string) => {
            SheetManager.hide('asset-preview');
            showDeleteConfirmation(assetId, asset.originalName);
          },
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
        <Button variant="solid" size="md" onPress={handleAddAsset}>
          <HStack space="sm" className="items-center">
            <Icon as={PlusIcon} className="text-white" size="sm" />
            <ButtonText>Subir Archivo</ButtonText>
          </HStack>
        </Button>
      </View>
    ),
    [handleAddAsset],
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

  if (isLoading && !assets) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text className="text-gray-600 mt-4">Cargando archivos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BottomSheetFlatList
        data={sortedAssets}
        renderItem={renderAssetItem}
        keyExtractor={keyExtractor}
        numColumns={3}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.flatListContent}
        ListEmptyComponent={ListEmptyComponent}
        ListHeaderComponent={sortedAssets.length > 0 ? ListHeaderComponent : null}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={COLORS.primary}
          />
        }
      />

      {/* Floating upload button */}
      <Animated.View style={[styles.floatingButton, { bottom: floatingUploadButtonBottom }]}>
        <Pressable onPress={handleAddAsset} style={styles.floatingButton}>
          <Icon as={PlusIcon} className="text-white" size="lg" />
        </Pressable>
      </Animated.View>

      {/* Floating confirm button for multi selection */}
      {context.isMulti && context.selectedAssets.length > 0 && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={styles.confirmButton}
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
          <Pressable style={styles.backdrop} onPress={() => setShowUploadOptions(false)} />

          {/* Options menu */}
          <Animated.View
            entering={FadeIn.duration(200)}
            style={[styles.uploadOptionsMenu, { bottom: uploadOptionsMenuBottom }]}
            pointerEvents="box-none"
          >
            <Pressable
              onPress={() => handleImagePickerOption('camera')}
              style={styles.uploadOption}
            >
              <Icon as={CameraIcon} className="text-gray-700 mr-3" size="md" />
              <Text className="text-gray-700">Tomar Foto</Text>
            </Pressable>
            <View style={styles.uploadOptionDivider} />
            <Pressable
              onPress={() => handleImagePickerOption('gallery')}
              style={styles.uploadOption}
            >
              <Icon as={GalleryIcon} className="text-gray-700 mr-3" size="md" />
              <Text className="text-gray-700">Seleccionar de Galería</Text>
            </Pressable>
          </Animated.View>
        </>
      )}

      {/* Upload loading indicator */}
      {isUploading && (
        <View style={styles.uploadingOverlay}>
          <View style={styles.uploadingContent}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text className="text-gray-700 mt-3">Subiendo imagen...</Text>
          </View>
        </View>
      )}
    </View>
  );
};
