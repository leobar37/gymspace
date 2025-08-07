import React, { useState, useEffect } from 'react';
import { useController } from 'react-hook-form';
import type { UseControllerProps, FieldValues } from 'react-hook-form';
import * as ImagePicker from 'expo-image-picker';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { Image } from '@/components/ui/image';
import { Button, ButtonText } from '@/components/ui/button';
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlHelper,
  FormControlHelperText,
} from '@/components/ui/form-control';
import { Box } from '@/components/ui/box';
import { Icon } from '@/components/ui/icon';
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { Center } from '@/components/ui/center';
import { Spinner } from '@/components/ui/spinner';
import { Camera, ImageIcon, X } from 'lucide-react-native';
import { useAsset } from '../controllers/assets.controller';
import type { AssetFieldValue, PendingAssetValue } from '../types/asset-form.types';
import { isPendingAsset, isExistingAsset } from '../types/asset-form.types';

interface PhotoFieldProps<TFieldValues extends FieldValues = FieldValues>
  extends UseControllerProps<TFieldValues> {
  label: string;
  description?: string;
  multiple?: boolean;
  maxFiles?: number;
  aspectRatio?: [number, number];
  quality?: number;
  allowsEditing?: boolean;
}

/**
 * Enhanced PhotoField that handles both string (existing asset ID) and object (pending upload) values
 * Works seamlessly with prepareAssets utility
 */
export function PhotoField<TFieldValues extends FieldValues = FieldValues>({
  name,
  control,
  rules,
  defaultValue,
  shouldUnregister,
  label,
  description,
  multiple = false,
  maxFiles = 1,
  aspectRatio,
  quality = 0.8,
  allowsEditing = true,
}: PhotoFieldProps<TFieldValues>) {
  
  const { field, fieldState } = useController({
    name,
    control,
    rules,
    defaultValue,
    shouldUnregister,
  });

  const fieldValue = field.value as AssetFieldValue;
  
  // State for preview and UI
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showSourceDialog, setShowSourceDialog] = useState(false);
  const [isLoadingAsset, setIsLoadingAsset] = useState(false);

  // Determine if we have an existing asset ID
  const existingAssetId = isExistingAsset(fieldValue) ? fieldValue : 
                          isPendingAsset(fieldValue) ? fieldValue.prevAssetId : 
                          null;

  // Fetch asset data if we have an existing asset ID
  const { data: existingAsset, isLoading: isLoadingExistingAsset } = useAsset(
    existingAssetId || '',
    !!existingAssetId
  );

  // Update preview URL based on field value
  useEffect(() => {
    if (isPendingAsset(fieldValue)) {
      // For pending uploads, create object URL from file
      if (fieldValue.file) {
        // Create a blob URL for preview (React Native doesn't have URL.createObjectURL)
        // So we'll use the file's URI if available, or read it
        if ('uri' in fieldValue.file) {
          setPreviewUrl((fieldValue.file as any).uri);
        }
      }
    } else if (isExistingAsset(fieldValue) && existingAsset?.previewUrl) {
      // For existing assets, use the previewUrl from the asset data
      setPreviewUrl(existingAsset.previewUrl);
    } else {
      setPreviewUrl(null);
    }
  }, [fieldValue, existingAsset]);

  // Request permissions
  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  };

  const requestGalleryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  };

  // Handle image selection from camera
  const handleCameraPress = async () => {
    setShowSourceDialog(false);
    
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      alert('Se requiere permiso para acceder a la cámara');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing,
      aspect: aspectRatio,
      quality,
      base64: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      await handleImageSelected(result.assets[0]);
    }
  };

  // Handle image selection from gallery
  const handleGalleryPress = async () => {
    setShowSourceDialog(false);
    
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) {
      alert('Se requiere permiso para acceder a la galería');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: !multiple && allowsEditing,
      allowsMultipleSelection: multiple,
      selectionLimit: maxFiles,
      aspect: aspectRatio,
      quality,
      base64: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      if (multiple) {
        for (const asset of result.assets) {
          await handleImageSelected(asset);
        }
      } else {
        await handleImageSelected(result.assets[0]);
      }
    }
  };

  // Handle selected image
  const handleImageSelected = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      // Convert to File object
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const filename = asset.uri.split('/').pop() || 'photo.jpg';
      const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
      
      // Add uri property for preview
      (file as any).uri = asset.uri;

      // Create pending asset value
      const pendingValue: PendingAssetValue = {
        file,
        // If we're replacing an existing asset, store its ID for cleanup
        prevAssetId: isExistingAsset(fieldValue) ? fieldValue : undefined,
      };

      // Update field value with pending asset
      field.onChange(pendingValue);
      
      // Update preview immediately
      setPreviewUrl(asset.uri);
    } catch (error) {
      console.error('Error handling image:', error);
      alert('Error al procesar la imagen');
    }
  };

  // Remove selected image
  const handleRemoveImage = () => {
    // Clear the field value
    field.onChange(null);
    setPreviewUrl(null);
  };

  // Loading state
  const isLoading = isLoadingExistingAsset || isLoadingAsset;

  return (
    <>
      <FormControl isInvalid={!!fieldState.error}>
        <VStack className="gap-3">
          {label && <Text className="font-medium text-gray-900">{label}</Text>}
          {description && (
            <FormControlHelper>
              <FormControlHelperText>{description}</FormControlHelperText>
            </FormControlHelper>
          )}

          {/* Image Preview or Upload Area */}
          {previewUrl ? (
            <Box className="relative">
              <Image
                source={{ uri: previewUrl }}
                alt="Preview"
                className="w-full h-48 rounded-lg"
                resizeMode="cover"
              />
              {isLoading && (
                <Center className="absolute inset-0 bg-black/50 rounded-lg">
                  <Spinner size="large" color="white" />
                  <Text className="text-white mt-2">Cargando...</Text>
                </Center>
              )}
              {!isLoading && (
                <Pressable
                  onPress={handleRemoveImage}
                  className="absolute top-2 right-2 bg-red-500 rounded-full p-1"
                >
                  <Icon as={X} size="sm" color="white" />
                </Pressable>
              )}
              {/* Indicator for pending upload */}
              {isPendingAsset(fieldValue) && (
                <Box className="absolute bottom-2 left-2 bg-yellow-500 px-2 py-1 rounded">
                  <Text className="text-xs text-white">Pendiente de subir</Text>
                </Box>
              )}
            </Box>
          ) : (
            <Pressable
              onPress={() => setShowSourceDialog(true)}
              disabled={isLoading}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8"
            >
              <VStack className="items-center gap-3">
                {isLoading ? (
                  <>
                    <Spinner size="large" />
                    <Text className="text-gray-600">Cargando imagen...</Text>
                  </>
                ) : (
                  <>
                    <Icon as={ImageIcon} size="xl" className="text-gray-400" />
                    <Text className="text-gray-600 text-center">
                      Toca para seleccionar una imagen
                    </Text>
                    <Text className="text-gray-400 text-sm text-center">
                      Puedes tomar una foto o seleccionar de la galería
                    </Text>
                  </>
                )}
              </VStack>
            </Pressable>
          )}

          {/* Action Buttons when image is selected */}
          {previewUrl && !isLoading && (
            <HStack className="gap-2">
              <Button
                size="sm"
                variant="outline"
                onPress={() => setShowSourceDialog(true)}
                className="flex-1"
              >
                <ButtonText>Cambiar imagen</ButtonText>
              </Button>
            </HStack>
          )}

          {fieldState.error && (
            <FormControlError>
              <FormControlErrorText>{fieldState.error.message}</FormControlErrorText>
            </FormControlError>
          )}
        </VStack>
      </FormControl>

      {/* Source Selection Dialog */}
      <AlertDialog isOpen={showSourceDialog} onClose={() => setShowSourceDialog(false)}>
        <AlertDialogBackdrop />
        <AlertDialogContent>
          <AlertDialogHeader>
            <Text className="text-lg font-semibold">Seleccionar imagen</Text>
          </AlertDialogHeader>
          <AlertDialogBody>
            <VStack className="gap-3">
              <Pressable
                onPress={handleCameraPress}
                className="flex-row items-center gap-3 p-3 rounded-lg bg-gray-50"
              >
                <Icon as={Camera} size="md" className="text-gray-700" />
                <Text className="text-gray-700">Tomar foto</Text>
              </Pressable>
              <Pressable
                onPress={handleGalleryPress}
                className="flex-row items-center gap-3 p-3 rounded-lg bg-gray-50"
              >
                <Icon as={ImageIcon} size="md" className="text-gray-700" />
                <Text className="text-gray-700">Seleccionar de galería</Text>
              </Pressable>
            </VStack>
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button
              variant="outline"
              size="sm"
              onPress={() => setShowSourceDialog(false)}
            >
              <ButtonText>Cancelar</ButtonText>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}