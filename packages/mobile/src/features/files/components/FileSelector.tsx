import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetItem,
  ActionsheetItemText,
} from '@/components/ui/actionsheet';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useLoadingScreen } from '@/shared/loading-screen';
import {
  CameraIcon,
  ImageIcon,
  ImagePlusIcon,
  LoaderIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
} from 'lucide-react-native';
import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Dimensions, FlatList, Pressable, View } from 'react-native';
import { useDeleteFile, useFilesByIds, useUploadFile } from '../controllers/files.controller';
import {
  createFileFromAsset,
  pickImageFromCamera,
  pickImageFromLibrary,
} from '../utils/image-picker';
import { FilePreview } from './FilePreview';
import { useFilesStore } from '../stores/files.store';

interface FileSelectorProps {
  name: string;
  multi?: boolean;
  label?: string;
  required?: boolean;
}

export function FileSelector({ name, multi = false, label, required = false }: FileSelectorProps) {
  const { control, watch, setValue } = useFormContext();
  const uploadFile = useUploadFile();
  const deleteFile = useDeleteFile();
  const { execute } = useLoadingScreen();
  const { openFileViewer } = useFilesStore();

  // State for action sheet
  const [showActionSheet, setShowActionSheet] = React.useState(false);
  const [showDeleteSheet, setShowDeleteSheet] = React.useState(false);
  const [fileToDelete, setFileToDelete] = React.useState<string | null>(null);

  // Watch the form value
  const formValue = watch(name);

  // Determine the file IDs based on multi mode
  const fileIds = React.useMemo(() => {
    if (!formValue) return [];

    if (multi) {
      // For multi mode, formValue should be an array
      return Array.isArray(formValue) ? formValue : [];
    } else {
      // For single mode, formValue should be a string
      return formValue ? [formValue] : [];
    }
  }, [formValue, multi]);

  // Fetch file data
  const { data: files, isLoading } = useFilesByIds(fileIds);

  // console.log("files updload", files);

  const handlePickFromLibrary = async () => {
    setShowActionSheet(false);

    const assets = await pickImageFromLibrary({
      allowsMultipleSelection: multi,
    });

    if (assets) {
      await handleUploadFiles(assets);
    }
  };

  const handlePickFromCamera = async () => {
    setShowActionSheet(false);
    const assets = await pickImageFromCamera();
    if (assets) {
      await handleUploadFiles(assets);
    }
  };

  const handleUploadFiles = async (assets: any[]) => {
    const uploadOperation = async () => {
      // If single mode and we already have a file, delete the old one first
      if (!multi && formValue) {
        try {
          await deleteFile.mutateAsync(formValue);
        } catch (error) {
          console.warn('Failed to delete old file:', error);
        }
      }

      const uploadPromises = assets.map((asset) => {
        const file = createFileFromAsset(asset);
        return uploadFile.mutateAsync({ file });
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      const newFileIds = uploadedFiles.map((file) => file.id);

      if (multi) {
        // For multi mode, append to existing files
        const currentIds = Array.isArray(formValue) ? formValue : [];
        setValue(name, [...currentIds, ...newFileIds]);
      } else {
        // For single mode, replace the current file
        setValue(name, newFileIds[0] || null);
      }
    };

    await execute(uploadOperation(), {
      action: 'Subiendo archivo...',
      successMessage: `Archivo${assets.length > 1 ? 's' : ''} subido${assets.length > 1 ? 's' : ''} exitosamente`,
    });
  };

  const handleDeleteFile = async (fileId: string) => {
    const deleteOperation = async () => {
      await deleteFile.mutateAsync(fileId);

      if (multi) {
        // Remove from array
        const currentIds = Array.isArray(formValue) ? formValue : [];
        const newIds = currentIds.filter((id) => id !== fileId);
        setValue(name, newIds);
      } else {
        // Clear single value
        setValue(name, null);
      }
    };

    await execute(deleteOperation(), {
      action: 'Eliminando archivo...',
      successMessage: 'Archivo eliminado exitosamente',
    });

    setShowDeleteSheet(false);
    setFileToDelete(null);
  };

  const handleLongPress = (fileId: string) => {
    setFileToDelete(fileId);
    setShowDeleteSheet(true);
  };

  const handleViewFile = () => {
    if (fileToDelete && files) {
      const fileToView = files.find(file => file.id === fileToDelete);
      if (fileToView) {
        openFileViewer(fileToView);
        setShowDeleteSheet(false);
        setFileToDelete(null);
      }
    }
  };

  const handlePreviewPress = () => {
    if (files && files.length > 0) {
      // If we have files, show picker to replace
      setShowActionSheet(true);
    } else {
      // No files, show picker to add
      setShowActionSheet(true);
    }
  };

  const screenWidth = Dimensions.get('window').width;
  const carouselWidth = screenWidth - 32; // Account for padding
  const gridItemSize = (carouselWidth - 24) / 2; // 2 columns with 12px gap between

  const renderPlaceholder = () => (
    <Pressable onPress={() => setShowActionSheet(true)}>
      <View
        className="bg-gray-100 rounded-lg items-center justify-center border-2 border-dashed border-gray-300"
        style={{ width: gridItemSize, height: gridItemSize }}
      >
        <Icon as={PlusIcon} size="lg" className="text-gray-400 mb-2" />
        <Text className="text-xs text-gray-500 text-center px-2">Agregar imagen</Text>
      </View>
    </Pressable>
  );

  const renderFileItem = ({ item: file }: { item: any }) => (
    <Pressable
      onPress={handlePreviewPress}
      onLongPress={() => handleLongPress(file.id)}
      delayLongPress={500}
    >
      <View
        className="rounded-lg overflow-hidden bg-gray-100"
        style={{ width: gridItemSize, height: gridItemSize }}
      >
        <FilePreview file={file} width={gridItemSize} height={gridItemSize} resizeMode="cover" />
      </View>
    </Pressable>
  );

  return (
    <>
      <Controller
        control={control}
        name={name}
        rules={{ required: required ? 'Se requiere un archivo' : undefined }}
        render={({ fieldState: { error } }) => (
          <VStack space="sm" className="w-full">
            {label && <Text className="text-sm font-medium text-gray-700">{label}</Text>}

            {/* File Preview Area */}
            {isLoading ? (
              <View className="h-48 bg-gray-100 rounded-lg items-center justify-center">
                <Icon as={LoaderIcon} size="lg" className="text-gray-400 animate-spin" />
                <Text className="text-gray-500 mt-2">Cargando archivos...</Text>
              </View>
            ) : (
              <View className="w-full">
                {multi ? (
                  // Multiple files - Grid layout
                  <View>
                    <FlatList
                      data={[...(files || []), 'placeholder']}
                      renderItem={({ item }) => {
                        if (item === 'placeholder') {
                          return renderPlaceholder();
                        }
                        return renderFileItem({ item });
                      }}
                      keyExtractor={(item, _index) =>
                        item === 'placeholder'
                          ? 'placeholder'
                          : typeof item === 'string'
                            ? item
                            : item.id
                      }
                      numColumns={2}
                      columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 12 }}
                      scrollEnabled={false}
                      showsVerticalScrollIndicator={false}
                    />
                    {files && files.length > 0 && (
                      <Text className="text-center text-xs text-gray-500 mt-2">
                        {files.length} archivo{files.length !== 1 ? 's' : ''} seleccionado
                        {files.length !== 1 ? 's' : ''}
                      </Text>
                    )}
                  </View>
                ) : // Single file
                files && files.length > 0 ? (
                  <Pressable
                    onPress={handlePreviewPress}
                    onLongPress={() => handleLongPress(files[0].id)}
                    delayLongPress={500}
                  >
                    <FilePreview
                      file={files[0]}
                      resizeMode="contain"
                      className="rounded-sm h-80"
                    />
                  </Pressable>
                ) : (
                  // No files - show clickable placeholder
                  <Pressable onPress={() => setShowActionSheet(true)}>
                    <View className="h-48 bg-gray-100 rounded-lg items-center justify-center border-2 border-dashed border-gray-300">
                      <Icon as={ImageIcon} size="xl" className="text-gray-400 mb-2" />
                      <Text className="text-gray-500">Sin archivos seleccionados</Text>
                      <Text className="text-xs text-gray-400 mt-1">Toca para seleccionar</Text>
                    </View>
                  </Pressable>
                )}
              </View>
            )}

            {/* Error Message */}
            {error && <Text className="text-xs text-red-500">{error.message}</Text>}
          </VStack>
        )}
      />

      {/* Image Picker Action Sheet */}
      <Actionsheet isOpen={showActionSheet} onClose={() => setShowActionSheet(false)}>
        <ActionsheetBackdrop />
        <ActionsheetContent>
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>

          <VStack space="md" className="w-full p-4">
            <Text className="text-lg font-semibold text-center text-gray-900">
              Seleccionar imagen
            </Text>

            <ActionsheetItem onPress={handlePickFromLibrary}>
              <HStack space="md" className="items-center">
                <Icon as={ImagePlusIcon} size="md" className="text-gray-600" />
                <ActionsheetItemText>Elegir de galería</ActionsheetItemText>
              </HStack>
            </ActionsheetItem>

            <ActionsheetItem onPress={handlePickFromCamera}>
              <HStack space="md" className="items-center">
                <Icon as={CameraIcon} size="md" className="text-gray-600" />
                <ActionsheetItemText>Tomar foto</ActionsheetItemText>
              </HStack>
            </ActionsheetItem>
          </VStack>
        </ActionsheetContent>
      </Actionsheet>

      {/* Delete Action Sheet */}
      <Actionsheet isOpen={showDeleteSheet} onClose={() => setShowDeleteSheet(false)}>
        <ActionsheetBackdrop />
        <ActionsheetContent>
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          <VStack space="md" className="w-full p-4">
            <Text className="text-lg font-semibold text-center text-gray-900">
              Opciones de archivo
            </Text>

            {fileToDelete && files && (() => {
              const file = files.find(f => f.id === fileToDelete);
              const isViewable = file && (file.mimeType.startsWith('image/') || file.mimeType.startsWith('video/'));
              
              return isViewable && (
                <ActionsheetItem onPress={handleViewFile}>
                  <HStack space="md" className="items-center">
                    <Icon as={EyeIcon} size="md" className="text-gray-600" />
                    <ActionsheetItemText>Ver en pantalla completa</ActionsheetItemText>
                  </HStack>
                </ActionsheetItem>
              );
            })()}

            <ActionsheetItem onPress={() => fileToDelete && handleDeleteFile(fileToDelete)}>
              <HStack space="md" className="items-center">
                <Icon as={TrashIcon} size="md" className="text-red-600" />
                <ActionsheetItemText className="text-red-600">Eliminar archivo</ActionsheetItemText>
              </HStack>
            </ActionsheetItem>
          </VStack>
        </ActionsheetContent>
      </Actionsheet>
    </>
  );
}
