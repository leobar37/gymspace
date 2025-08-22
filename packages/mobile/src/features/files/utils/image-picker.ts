import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export interface ImagePickerOptions {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
  allowsMultipleSelection?: boolean;
}

export async function requestPermissions() {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permisos requeridos',
      'Se necesitan permisos para acceder a la galería de fotos.'
    );
    return false;
  }
  return true;
}

export async function requestCameraPermissions() {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permisos requeridos',
      'Se necesitan permisos para acceder a la cámara.'
    );
    return false;
  }
  return true;
}

export async function pickImageFromLibrary(options: ImagePickerOptions = {}) {
  const hasPermission = await requestPermissions();
  if (!hasPermission) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: options.allowsEditing ?? true,
    aspect: options.aspect ?? [4, 3],
    quality: options.quality ?? 0.8,
    allowsMultipleSelection: options.allowsMultipleSelection ?? false,
  });

  if (!result.canceled) {
    return result.assets;
  }

  return null;
}

export async function pickImageFromCamera(options: ImagePickerOptions = {}) {
  const hasPermission = await requestCameraPermissions();
  if (!hasPermission) return null;

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: options.allowsEditing ?? true,
    aspect: options.aspect ?? [4, 3],
    quality: options.quality ?? 0.8,
  });

  if (!result.canceled) {
    return result.assets;
  }

  return null;
}

export function showImagePickerActionSheet(
  onLibrary: () => void,
  onCamera: () => void,
  onCancel?: () => void
) {
  Alert.alert(
    'Seleccionar imagen',
    'Elige una opción',
    [
      { text: 'Galería', onPress: onLibrary },
      { text: 'Cámara', onPress: onCamera },
      { text: 'Cancelar', style: 'cancel', onPress: onCancel },
    ]
  );
}

// Convert ImagePicker asset to File for upload
export function createFileFromAsset(asset: ImagePicker.ImagePickerAsset): File {
  const filename = asset.fileName || asset.uri.split('/').pop() || 'image.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  // Create a File-like object that works with React Native
  return {
    uri: asset.uri,
    name: filename,
    type: type,
    size: asset.fileSize,
  } as any;
}