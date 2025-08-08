import React from 'react';
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
} from '@/components/ui/modal';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Pressable } from '@/components/ui/pressable';
import { Icon } from '@/components/ui/icon';
import { X as CloseIcon, Plus as PlusIcon } from 'lucide-react-native';
import { FlatList, View, ActivityIndicator, Alert } from 'react-native';
import { useAssetsStore } from '../stores/assets.store';
import { useAllAssets, useDeleteAsset, useUploadAsset } from '../controllers/assets.controller';
import { AssetPreview } from './AssetPreview';
import * as ImagePicker from 'expo-image-picker';
import type { AssetResponseDto } from '@gymspace/sdk';

export function AssetModal() {
  const {
    modal,
    closeModal,
    toggleAssetSelection,
    setSelectedAssets,
  } = useAssetsStore();
  
  const { data: assets, isLoading, refetch } = useAllAssets(modal.isOpen);
  const deleteAssetMutation = useDeleteAsset();
  const uploadAssetMutation = useUploadAsset();
  
  const handleClose = () => {
    closeModal();
  };
  
  const handleConfirm = () => {
    if (modal.onSelect) {
      modal.onSelect(modal.selectedAssets);
    }
    closeModal();
  };
  
  const handleAddAsset = async () => {
    try {
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
      console.error('Error picking image:', error);
      Alert.alert('Error', 'No se pudo cargar el archivo');
    }
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
    
    return (
      <Pressable
        onPress={() => toggleAssetSelection(item.id)}
        onLongPress={() => handleDeleteAsset(item.id)}
        className="relative m-1"
      >
        <View className={`border-2 rounded-lg ${isSelected ? 'border-primary-500' : 'border-transparent'}`}>
          <AssetPreview
            asset={item}
            width={100}
            height={100}
            className="rounded-lg"
            resizeMode="cover"
          />
        </View>
        {isSelected && (
          <View className="absolute top-1 right-1 bg-primary-500 rounded-full p-1">
            <Icon as={CloseIcon} className="text-white" size="xs" />
          </View>
        )}
      </Pressable>
    );
  };
  
  // Sort assets to show selected ones first
  const sortedAssets = React.useMemo(() => {
    if (!assets) return [];
    
    return [...assets].sort((a, b) => {
      const aSelected = modal.selectedAssets.includes(a.id);
      const bSelected = modal.selectedAssets.includes(b.id);
      
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return 0;
    });
  }, [assets, modal.selectedAssets]);
  
  return (
    <Modal isOpen={modal.isOpen} onClose={handleClose} size="lg">
      <ModalBackdrop />
      <ModalContent className="max-h-[80%]">
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
        
        <ModalBody>
          <VStack space="md" className="flex-1">
            {/* Add Asset Button */}
            <Button onPress={handleAddAsset} variant="outline" className="self-start">
              <HStack space="xs" className="items-center">
                <Icon as={PlusIcon} />
                <ButtonText>Agregar Archivo</ButtonText>
              </HStack>
            </Button>
            
            {/* Asset Grid */}
            {isLoading ? (
              <View className="flex-1 items-center justify-center py-8">
                <ActivityIndicator size="large" />
              </View>
            ) : sortedAssets.length === 0 ? (
              <View className="flex-1 items-center justify-center py-8">
                <Text className="text-gray-500">No hay archivos disponibles</Text>
                <Button onPress={handleAddAsset} variant="link" className="mt-2">
                  <ButtonText>Agrega tu primer archivo</ButtonText>
                </Button>
              </View>
            ) : (
              <FlatList
                data={sortedAssets}
                renderItem={renderAssetItem}
                keyExtractor={(item) => item.id}
                numColumns={3}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            )}
            
            {/* Selection Info */}
            {modal.selectedAssets.length > 0 && (
              <Text className="text-sm text-gray-600">
                {modal.selectedAssets.length} archivo{modal.selectedAssets.length !== 1 ? 's' : ''} seleccionado{modal.selectedAssets.length !== 1 ? 's' : ''}
              </Text>
            )}
          </VStack>
        </ModalBody>
        
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