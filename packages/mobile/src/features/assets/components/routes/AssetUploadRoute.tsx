import React from 'react';
import { View, Alert, Linking, ActivityIndicator } from 'react-native';
import { useMultiScreenContext } from '@/components/ui/multi-screen';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import {
  Camera as CameraIcon,
  Image as ImageIcon,
  Upload as UploadIcon,
  Info as InfoIcon,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { FadeIn } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { useUploadAsset } from '../../controllers/assets.controller';
import { useQueryClient } from '@tanstack/react-query';
import { assetsKeys } from '../../controllers/assets.controller';
import type { AssetSelectorRouteContext } from '../AssetSelectorSheet';

interface AssetUploadRouteProps {
  route: {
    params: AssetSelectorRouteContext;
  };
}

interface UploadOption {
  id: string;
  icon: any;
  title: string;
  description: string;
  color: string;
  action: () => Promise<void>;
}

export const AssetUploadRoute: React.FC<AssetUploadRouteProps> = ({ route }) => {
  const { router } = useMultiScreenContext();
  const context = route.params;
  const uploadAssetMutation = useUploadAsset();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = React.useState(false);

  const requestMediaLibraryPermissions = async (): Promise<boolean> => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permisos necesarios',
        'Se necesita acceso a tu galería de fotos para seleccionar imágenes.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir Configuración', onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    }
    return true;
  };

  const requestCameraPermissions = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permisos necesarios',
        'Se necesita acceso a tu cámara para tomar fotos.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir Configuración', onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    }
    return true;
  };

  const handleUploadSuccess = async (uploadedAssetIds: string[]) => {
    // Refresh the assets list
    await queryClient.invalidateQueries({ queryKey: assetsKeys.all });
    
    // Add to selection if needed
    if (context.isMulti) {
      context.setSelectedAssets([...context.selectedAssets, ...uploadedAssetIds]);
    } else {
      context.setSelectedAssets(uploadedAssetIds);
    }
    
    // Navigate back to list
    router.goBack();
  };

  const pickImageFromLibrary = async () => {
    try {
      const hasPermission = await requestMediaLibraryPermissions();
      if (!hasPermission) return;

      setIsProcessing(true);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: context.isMulti,
      });

      if (!result.canceled) {
        const uploadedIds: string[] = [];
        
        for (const asset of result.assets) {
          const file = {
            uri: asset.uri,
            type: asset.type === 'video' ? 'video/mp4' : 'image/jpeg',
            name: asset.fileName || `asset_${Date.now()}.jpg`,
          } as any;

          const uploadedAsset = await uploadAssetMutation.mutateAsync({
            file,
            metadata: {
              width: asset.width,
              height: asset.height,
              duration: (asset as any).duration,
            },
          });
          
          uploadedIds.push(uploadedAsset.id);
        }

        await handleUploadSuccess(uploadedIds);
      }
    } catch (error) {
      console.error('Error picking image from library:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    } finally {
      setIsProcessing(false);
    }
  };

  const takePhotoWithCamera = async () => {
    try {
      const hasPermission = await requestCameraPermissions();
      if (!hasPermission) return;

      setIsProcessing(true);

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

        const uploadedAsset = await uploadAssetMutation.mutateAsync({
          file,
          metadata: {
            width: asset.width,
            height: asset.height,
          },
        });

        await handleUploadSuccess([uploadedAsset.id]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    } finally {
      setIsProcessing(false);
    }
  };

  // Removed document picker functionality - not needed for image/video assets

  const uploadOptions: UploadOption[] = [
    {
      id: 'camera',
      icon: CameraIcon,
      title: 'Tomar Foto',
      description: 'Captura una nueva foto con la cámara',
      color: '#10b981',
      action: takePhotoWithCamera,
    },
    {
      id: 'gallery',
      icon: ImageIcon,
      title: 'Galería',
      description: 'Selecciona fotos o videos de tu galería',
      color: '#6366f1',
      action: pickImageFromLibrary,
    },
  ];

  if (isProcessing || uploadAssetMutation.isPending) {
    return (
      <View className="flex-1 items-center justify-center py-20 bg-white">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="text-gray-600 mt-4">Subiendo imagen...</Text>
        <Text className="text-gray-400 text-sm mt-2">Por favor espera</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <VStack space="lg" className="p-6">
        {/* Header */}
        <View className="items-center">
          <View className="bg-indigo-100 rounded-full p-4 mb-4">
            <Icon as={UploadIcon} size="xl" className="text-indigo-600" />
          </View>
          <Text className="text-xl font-semibold text-gray-900">
            Agregar Fotos y Videos
          </Text>
          <Text className="text-sm text-gray-500 mt-1 text-center">
            Elige cómo quieres agregar contenido multimedia
          </Text>
        </View>

        {/* Upload Options */}
        <VStack space="md">
          {uploadOptions.map((option, index) => (
            <Animated.View
              key={option.id}
              entering={FadeIn.duration(300).delay(index * 100)}
            >
              <Button
                variant="outline"
                size="lg"
                onPress={option.action}
                className="w-full"
              >
                <HStack className="items-center flex-1 py-2">
                  <View 
                    className="rounded-lg p-3 mr-4"
                    style={{ backgroundColor: `${option.color}20` }}
                  >
                    <Icon 
                      as={option.icon} 
                      size="md" 
                      style={{ color: option.color }}
                    />
                  </View>
                  <VStack className="flex-1 items-start">
                    <Text className="text-base font-medium text-gray-900">
                      {option.title}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {option.description}
                    </Text>
                  </VStack>
                </HStack>
              </Button>
            </Animated.View>
          ))}
        </VStack>

        {/* Info Section */}
        <View className="bg-blue-50 rounded-xl p-4 mt-4">
          <HStack space="md" className="items-start">
            <Icon as={InfoIcon} size="sm" className="text-blue-600 mt-1" />
            <VStack className="flex-1" space="xs">
              <Text className="text-sm font-medium text-blue-900">
                Formatos soportados
              </Text>
              <Text className="text-xs text-blue-700">
                Fotos: JPG, PNG, GIF, HEIC{'\n'}
                Videos: MP4, MOV, AVI
              </Text>
              {context.isMulti && (
                <Text className="text-xs text-blue-600 font-medium mt-1">
                  Puedes seleccionar múltiples archivos
                </Text>
              )}
            </VStack>
          </HStack>
        </View>
      </VStack>
    </View>
  );
};