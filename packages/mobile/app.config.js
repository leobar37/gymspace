// Banner: GymSpace Mobile App Configuration
export default ({ config }) => {
  return {
    expo: {
      name: 'GymSpace',
      slug: 'gymspace',
      version: '1.0.0',
      orientation: 'portrait',
      icon: './assets/icon.png',
      userInterfaceStyle: 'light',
      newArchEnabled: true,
      scheme: 'gymspace',
      splash: {
        image: './assets/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
      },
      ios: {
        supportsTablet: true,
        bundleIdentifier: 'com.elena.gymspace',
        infoPlist: {
          ITSAppUsesNonExemptEncryption: false,
        },
      },
      android: {
        adaptiveIcon: {
          foregroundImage: './assets/adaptive-icon.png',
          backgroundColor: '#ffffff',
        },
        package: 'com.elena.gymspace',
        edgeToEdgeEnabled: true,
        permissions: [
          'android.permission.RECORD_AUDIO',
          'android.permission.READ_EXTERNAL_STORAGE',
          'android.permission.WRITE_EXTERNAL_STORAGE',
        ],
      },
      web: {
        favicon: './assets/favicon.png',
        bundler: 'metro',
      },
      plugins: [
        [
          'expo-router',
          {
            root: './src/app',
          },
        ],
        'expo-secure-store',
        'expo-system-ui',
        [
          'expo-image-picker',
          {
            photosPermission:
              'La aplicación necesita acceso a tus fotos para que puedas seleccionar imágenes.',
            cameraPermission:
              'La aplicación necesita acceso a tu cámara para que puedas tomar fotos.',
          },
        ],
        [
          'expo-media-library',
          {
            photosPermission:
              'La aplicación necesita acceso a tu galería de fotos para que puedas seleccionar y guardar imágenes.',
            savePhotosPermission:
              'La aplicación necesita permiso para guardar fotos en tu galería.',
            isAccessMediaLocationEnabled: false,
          },
        ],
      ],
      extra: {
        router: {},
        eas: {
          projectId: '5b3b864b-a0e0-4c50-be4e-0432267c145e',
        },
      },
      owner: 'leobar37',
    },
  };
};
