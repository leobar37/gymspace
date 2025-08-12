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
import { X as CloseIcon, Plus as PlusIcon, Check as CheckIcon, Trash2 as TrashIcon, Upload as UploadIcon } from 'lucide-react-native';
import { FlatList, View, ActivityIndicator, Alert } from 'react-native';
import { useFilesStore } from '../stores/files.store';
import { useAllFiles, useDeleteFile, useUploadFile } from '../controllers/files.controller';
import { FilePreview } from './FilePreview';
import * as ImagePicker from 'expo-image-picker';
import type { FileResponseDto } from '@gymspace/sdk';

export function FileModal() {
  const {
    modal,
    closeModal,
    toggleFileSelection,
    setSelectedFiles,
  } = useFilesStore();

  // Always call hooks - use enabled parameter to control fetching
  const { data: files, isLoading, refetch } = useAllFiles(modal.isOpen);
  const deleteFileMutation = useDeleteFile();
  const uploadFileMutation = useUploadFile();
  const [isUploading, setIsUploading] = React.useState(false);

  // Sort files to show selected ones first
  const sortedFiles = React.useMemo(() => {
    if (!files) return [];

    return [...files].sort((a, b) => {
      const aSelected = modal.selectedFiles.includes(a.id);
      const bSelected = modal.selectedFiles.includes(b.id);

      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return 0;
    });
  }, [files, modal.selectedFiles]);

  // Don't render anything if modal is not open
  if (!modal.isOpen) {
    return null;
  }

  console.log("sortedFiles hello", JSON.stringify(sortedFiles, null, 2));
  
  const handleClose = () => {
    closeModal();
  };

  const handleConfirm = () => {
    if (modal.onSelect) {
      modal.onSelect(modal.selectedFiles);
    }
    closeModal();
  };

  const handleAddFile = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: modal.isMulti,
      });

      if (!result.canceled) {
        setIsUploading(true);
        let uploadSuccess = true;

        try {
          for (const asset of result.assets) {
            const file = {
              uri: asset.uri,
              type: 'image/jpeg',
              name: asset.fileName || `file_${Date.now()}.jpg`,
            } as any;

            await uploadFileMutation.mutateAsync({
              file,
              metadata: {
                width: asset.width,
                height: asset.height,
              },
            });
          }

          await refetch();
          Alert.alert('Éxito', 'Archivo(s) subido(s) correctamente');
        } catch (uploadError) {
          uploadSuccess = false;
          console.error('Error uploading file:', uploadError);
          Alert.alert('Error', 'No se pudo subir el archivo. Por favor intenta de nuevo.');
        } finally {
          setIsUploading(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'No se pudo seleccionar el archivo');
    }
  };

  const handleDeleteFile = (fileId: string) => {
    Alert.alert(
      'Eliminar Archivo',
      '¿Estás seguro de que deseas eliminar este archivo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFileMutation.mutateAsync(fileId);

              // Remove from selection if it was selected
              if (modal.selectedFiles.includes(fileId)) {
                setSelectedFiles(modal.selectedFiles.filter(id => id !== fileId));
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

  const renderFile = ({ item }: { item: FileResponseDto }) => {
    const isSelected = modal.selectedFiles.includes(item.id);

    return (
      <View style={{ width: '50%', padding: 8 }}>
        <Pressable
          onPress={() => {
            console.log('File pressed:', item.id, 'isMulti:', modal.isMulti);
            toggleFileSelection(item.id);
          }}
          onLongPress={() => handleDeleteFile(item.id)}
        >
          <View style={{
            position: 'relative',
            borderRadius: 8,
            overflow: 'hidden',
            borderWidth: isSelected ? 2 : 0,
            borderColor: isSelected ? '#3b82f6' : 'transparent'
          }}>
            <FilePreview
              file={item}
              width={160}
              height={160}
              resizeMode="cover"
            />

            {/* Selection indicator */}
            {isSelected && (
              <View style={{
                position: 'absolute',
                top: 8,
                right: 8,
                backgroundColor: '#3b82f6',
                borderRadius: 12,
                padding: 4
              }}>
                <Icon as={CheckIcon} size="xs" className="text-white" />
              </View>
            )}

            {/* Delete button */}
            <Pressable
              onPress={() => {
                handleDeleteFile(item.id);
              }}
              style={{
                position: 'absolute',
                top: 8,
                left: 8,
                backgroundColor: '#ef4444',
                borderRadius: 12,
                padding: 4,
                opacity: 0.8
              }}
            >
              <Icon as={TrashIcon} size="xs" className="text-white" />
            </Pressable>
          </View>
        </Pressable>
      </View>
    );
  };

  return (
    <Modal
      isOpen={modal.isOpen}
      onClose={handleClose}
      size="full"
    >
      <ModalBackdrop />
      <ModalContent style={{ minHeight: '85%' }}>
        <ModalHeader>
          <VStack className="flex-1">
            <Text className="text-lg font-semibold">Seleccionar Archivos</Text>
            <Text className="text-sm text-gray-500">
              {modal.isMulti ? 'Selecciona múltiples archivos' : 'Selecciona un archivo'}
            </Text>
            {modal.selectedFiles.length > 0 && (
              <Text className="text-xs text-blue-600 mt-1">
                {modal.selectedFiles.length} archivo{modal.selectedFiles.length > 1 ? 's' : ''} seleccionado{modal.selectedFiles.length > 1 ? 's' : ''}
              </Text>
            )}
          </VStack>
          <ModalCloseButton>
            <Icon as={CloseIcon} size="lg" />
          </ModalCloseButton>
        </ModalHeader>

        {/* Content */}
        <View className="flex-1 p-4">
          {/* Upload Loading Overlay */}
          {isUploading && (
            <View className="absolute inset-0 bg-black/50 z-50 items-center justify-center">
              <View className="bg-white rounded-lg p-6 items-center">
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text className="mt-3 text-gray-700">Subiendo archivo...</Text>
              </View>
            </View>
          )}

          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" />
            </View>
          ) : sortedFiles.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-gray-500 mb-4">No hay archivos aún</Text>
              <Button onPress={handleAddFile} variant="solid" disabled={isUploading}>
                <ButtonText>Subir Archivo</ButtonText>
              </Button>
            </View>
          ) : (
            <FlatList
              data={sortedFiles}
              renderItem={renderFile}
              keyExtractor={(item) => item.id}
              numColumns={2}
              contentContainerStyle={{ paddingBottom: 100 }}
              showsVerticalScrollIndicator={true}
              style={{ height: 'auto' }}
            />
          )}

          {/* Floating add button - always show when not loading */}
          {!isLoading && sortedFiles.length > 0 && !isUploading && (
            <Pressable
              onPress={handleAddFile}
              style={{
                position: 'absolute',
                bottom: 16,
                right: 16,
                backgroundColor: '#3b82f6',
                borderRadius: 28,
                padding: 16,
                elevation: 5,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84
              }}
            >
              <Icon as={PlusIcon} size="lg" className="text-white" />
            </Pressable>
          )}
        </View>

        <ModalFooter className="pb-4">
          <HStack space="sm">
            <Button variant="outline" onPress={handleClose}>
              <ButtonText>Cancelar</ButtonText>
            </Button>
            <Button onPress={handleConfirm} variant="solid">
              <ButtonText>
                Seleccionar {modal.selectedFiles.length > 0 && `(${modal.selectedFiles.length})`}
              </ButtonText>
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}