import React from 'react';
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalFooter,
} from '@/components/ui/modal';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Pressable } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { X as CloseIcon, Plus as PlusIcon, Check as CheckIcon } from 'lucide-react-native';
import { FlatList, View, ActivityIndicator, Alert, ActionSheetIOS, Platform } from 'react-native';
import { useAssetsStore } from '../stores/assets.store';
import { useAllAssets, useDeleteAsset, useUploadAsset } from '../controllers/assets.controller';
import { AssetPreview } from './AssetPreview';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import type { AssetResponseDto } from '@gymspace/sdk';

export function AssetModal() {
  const {
    modal,
    closeModal,
    toggleAssetSelection,
    setSelectedAssets,
  } = useAssetsStore();

  // Always call hooks - use enabled parameter to control fetching
  const { data: assets, isLoading, refetch } = useAllAssets(modal.isOpen);
  const deleteAssetMutation = useDeleteAsset();
  const uploadAssetMutation = useUploadAsset();

  // Sort assets to show selected ones first - must be called before any conditional returns
  const sortedAssets = React.useMemo(() => {
    console.log('[AssetModal] Computing sortedAssets:', {
      assetsLength: assets?.length,
      selectedAssets: modal.selectedAssets,
      isMulti: modal.isMulti
    });
    if (!assets) return [];

    return [...assets].sort((a, b) => {
      const aSelected = modal.selectedAssets.includes(a.id);
      const bSelected = modal.selectedAssets.includes(b.id);

      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return 0;
    });
  }, [assets, modal.selectedAssets]);

  // Don't render anything if modal is not open
  if (!modal.isOpen) {
    return null;
  }


  const handleClose = () => {
    closeModal();
  };

  const handleConfirm = () => {
    if (modal.onSelect) {
      modal.onSelect(modal.selectedAssets);
    }
    closeModal();
  };

  const requestMediaLibraryPermissions = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permisos necesarios',
        'Se necesita acceso a tu galería de fotos para seleccionar imágenes. Por favor, habilita los permisos en la configuración de tu dispositivo.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir Configuración', onPress: () => ImagePicker.openSettings() },
        ]
      );
      return false;
    }
    return true;
  };

  const requestCameraPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permisos necesarios',
        'Se necesita acceso a tu cámara para tomar fotos. Por favor, habilita los permisos en la configuración de tu dispositivo.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir Configuración', onPress: () => ImagePicker.openSettings() },
        ]
      );
      return false;
    }
    return true;
  };

  const pickImageFromLibrary = async () => {
    try {
      // Request permissions first
      const hasPermission = await requestMediaLibraryPermissions();
      if (!hasPermission) {
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: modal.isMulti,
      });

      if (!result.canceled) {
        for (const asset of result.assets) {
          const file = {
            uri: asset.uri,
            type: asset.type === 'video' ? 'video/mp4' : 'image/jpeg',
            name: asset.fileName || `asset_${Date.now()}.jpg`,
          } as any;

          await uploadAssetMutation.mutateAsync({
            file,
            metadata: {
              width: asset.width,
              height: asset.height,
              duration: (asset as any).duration,
            },
          });
        }

        refetch();
      }
    } catch (error) {
      console.error('Error picking image from library:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen de la galería');
    }
  };

  const takePhotoWithCamera = async () => {
    try {
      // Request camera permissions first
      const hasPermission = await requestCameraPermissions();
      if (!hasPermission) {
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        const file = {
          uri: asset.uri,
          type: 'image/jpeg',
          name: `photo_${Date.now()}.jpg`,
        } as any;

        await uploadAssetMutation.mutateAsync({
          file,
          metadata: {
            width: asset.width,
            height: asset.height,
          },
        });

        refetch();
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const checkPermissionsAndShowOptions = async () => {
    // Check current permission status without requesting
    const mediaLibraryStatus = await MediaLibrary.getPermissionsAsync();
    const cameraStatus = await ImagePicker.getCameraPermissionsAsync();

    const hasMediaLibraryPermission = mediaLibraryStatus.status === 'granted';
    const hasCameraPermission = cameraStatus.status === 'granted';

    // If neither permission is granted, ask which one they want to use first
    if (!hasMediaLibraryPermission && !hasCameraPermission) {
      Alert.alert(
        'Permisos necesarios',
        'Para subir fotos, necesitas dar permisos de acceso a la galería o cámara. ¿Qué deseas hacer?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Usar Galería', 
            onPress: async () => {
              const granted = await requestMediaLibraryPermissions();
              if (granted) {
                pickImageFromLibrary();
              }
            }
          },
          { 
            text: 'Usar Cámara', 
            onPress: async () => {
              const granted = await requestCameraPermissions();
              if (granted) {
                takePhotoWithCamera();
              }
            }
          },
        ],
        { cancelable: true }
      );
      return;
    }

    // Show options based on available permissions
    const options = ['Cancelar'];
    const actions: (() => void)[] = [];
    
    if (hasMediaLibraryPermission) {
      options.push('Seleccionar de Galería');
      actions.push(pickImageFromLibrary);
    }
    
    if (hasCameraPermission) {
      options.push('Tomar Foto');
      actions.push(takePhotoWithCamera);
    }

    // If only one permission is available but not the other, also add option to request the other
    if (hasMediaLibraryPermission && !hasCameraPermission) {
      options.push('Habilitar Cámara');
      actions.push(async () => {
        const granted = await requestCameraPermissions();
        if (granted) {
          takePhotoWithCamera();
        }
      });
    } else if (!hasMediaLibraryPermission && hasCameraPermission) {
      options.push('Habilitar Galería');
      actions.push(async () => {
        const granted = await requestMediaLibraryPermissions();
        if (granted) {
          pickImageFromLibrary();
        }
      });
    }

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex > 0 && buttonIndex <= actions.length) {
            actions[buttonIndex - 1]();
          }
        }
      );
    } else {
      // For Android, create alert options
      const alertOptions = actions.map((action, index) => ({
        text: options[index + 1], // Skip 'Cancelar' which is at index 0
        onPress: action,
      }));
      
      Alert.alert(
        'Seleccionar imagen',
        'Elige de dónde quieres seleccionar la imagen',
        [
          { text: 'Cancelar', style: 'cancel' },
          ...alertOptions,
        ],
        { cancelable: true }
      );
    }
  };

  const handleAddAsset = () => {
    checkPermissionsAndShowOptions();
  };

  const handleDeleteAsset = (assetId: string) => {
    Alert.alert(
      'Eliminar Archivo',
      '¿Estás seguro de que quieres eliminar este archivo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAssetMutation.mutateAsync(assetId);

              // Remove from selection if it was selected
              if (modal.selectedAssets.includes(assetId)) {
                setSelectedAssets(modal.selectedAssets.filter(id => id !== assetId));
              }

              refetch();
            } catch (error) {
              console.error('Error deleting asset:', error);
              Alert.alert('Error', 'No se pudo eliminar el archivo');
            }
          },
        },
      ]
    );
  };

  const renderAssetItem = ({ item }: { item: AssetResponseDto }) => {
    const isSelected = modal.selectedAssets.includes(item.id);
    console.log('[AssetModal] renderAssetItem:', {
      assetId: item.id,
      assetName: item.originalName,
      isSelected,
      currentSelectedAssets: modal.selectedAssets,
      isMulti: modal.isMulti
    });
    
    return (
      <View style={{ flex: 1, padding: 8 }}>
        <Pressable
          onPress={() => {
            console.log('[AssetModal] Asset pressed:', item.id);
            console.log('[AssetModal] Before toggle - selectedAssets:', modal.selectedAssets);
            toggleAssetSelection(item.id);
            console.log('[AssetModal] toggleAssetSelection called for:', item.id);
          }}
          onLongPress={() => handleDeleteAsset(item.id)}
          style={{ 
            width: '100%',
            aspectRatio: 1,
            position: 'relative'
          }}
        >
          <View 
            style={{
              flex: 1,
              borderWidth: 2,
              borderRadius: 12,
              borderColor: isSelected ? '#6366f1' : 'transparent',
              overflow: 'hidden',
              backgroundColor: '#f3f4f6'
            }}
          >
            <AssetPreview
              asset={item}
              width={undefined}
              height={undefined}
              resizeMode="cover"
              className="w-full h-full"
            />
          </View>
          {isSelected && (
            <View style={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: '#6366f1',
              borderRadius: 12,
              padding: 4
            }}>
              <Icon as={CheckIcon} className="text-white" size="xs" />
            </View>
          )}
        </Pressable>
      </View>
    );
  };

  console.log('[AssetModal] Modal state:', {
    isOpen: modal.isOpen,
    isLoading,
    assetsCount: sortedAssets.length,
    selectedCount: modal.selectedAssets.length
  });

  return (
    <Modal isOpen={modal.isOpen} onClose={handleClose} size="full">
      <ModalBackdrop />
      <ModalContent style={{ height: '90%', maxHeight: '90%' }}>
        <ModalHeader>
          <HStack className="flex-1 items-center justify-between">
            <Text className="text-lg font-semibold">
              {modal.isMulti ? 'Seleccionar Archivos' : 'Seleccionar Archivo'}
            </Text>
            <ModalCloseButton onPress={handleClose}>
              <Icon as={CloseIcon} />
            </ModalCloseButton>
          </HStack>
        </ModalHeader>

        <View style={{ flex: 1, minHeight: 400, position: 'relative' }}>
          {/* Loading overlay when uploading */}
          {uploadAssetMutation.isPending && (
            <View style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
            }}>
              <View style={{
                backgroundColor: 'white',
                padding: 20,
                borderRadius: 12,
                alignItems: 'center',
              }}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text className="mt-2 text-gray-700">Subiendo archivo...</Text>
              </View>
            </View>
          )}
          
          {isLoading ? (
            <View className="flex-1 items-center justify-center py-8">
              <ActivityIndicator size="large" />
            </View>
          ) : sortedAssets.length === 0 ? (
            <VStack space="md" className="flex-1 p-4">
              <Button 
                onPress={handleAddAsset} 
                variant="outline" 
                className="self-start"
                isDisabled={uploadAssetMutation.isPending}
              >
                <HStack space="xs" className="items-center">
                  <Icon as={PlusIcon} />
                  <ButtonText>Agregar Archivo</ButtonText>
                </HStack>
              </Button>
              <View className="flex-1 items-center justify-center py-8">
                <Text className="text-gray-500">No hay archivos disponibles</Text>
                <Button 
                  onPress={handleAddAsset} 
                  variant="link" 
                  className="mt-2"
                  isDisabled={uploadAssetMutation.isPending}
                >
                  <ButtonText>Subir o tomar foto</ButtonText>
                </Button>
              </View>
            </VStack>
          ) : (
            <View style={{ flex: 1 }}>
              <FlatList
                data={sortedAssets}
                renderItem={renderAssetItem}
                keyExtractor={(item) => item.id}
                numColumns={3}
                columnWrapperStyle={{ paddingHorizontal: 12 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 24, paddingTop: 12, minHeight: 300 }}
                ListHeaderComponent={
                  <View className="p-4 pb-2">
                    <Button 
                      onPress={handleAddAsset} 
                      variant="outline" 
                      className="self-start"
                      isDisabled={uploadAssetMutation.isPending}
                    >
                      <HStack space="xs" className="items-center">
                        <Icon as={PlusIcon} />
                        <ButtonText>Subir o Tomar Foto</ButtonText>
                      </HStack>
                    </Button>
                  </View>
                }
                ListFooterComponent={
                  modal.selectedAssets.length > 0 ? (
                    <View className="p-4">
                      <Text className="text-sm text-gray-600">
                        {modal.selectedAssets.length} archivo{modal.selectedAssets.length !== 1 ? 's' : ''} seleccionado{modal.selectedAssets.length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  ) : null
                }
              />
            </View>
          )}
        </View>

        <ModalFooter>
          <HStack space="sm" className="justify-end">
            <Button variant="outline" onPress={handleClose}>
              <ButtonText>Cancelar</ButtonText>
            </Button>
            <Button
              onPress={handleConfirm}
              isDisabled={modal.selectedAssets.length === 0}
            >
              <ButtonText>Confirmar</ButtonText>
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}