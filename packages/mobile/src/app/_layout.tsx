import { GlobalModals } from '@/components/GlobalModals';
import { AppProviders } from '@/providers/AppProviders';
import { LoadingScreen } from '@/shared/loading-screen';
import { Stack } from 'expo-router';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LogBox } from 'react-native';
import '../../global.css';

// Temporary fix for gluestack-ui v3 CssInterop warning
// This is a known issue with gluestack-ui v3 and React Native
// See: https://github.com/gluestack/gluestack-ui/issues/3200
if (__DEV__) {
  const originalWarn = console.warn;
  const originalError = console.error;

  // Filter specific warnings
  console.warn = (...args) => {
    const warningMessage = args[0]?.toString() || '';

    // Ignore specific gluestack-ui v3 warnings
    if (
      warningMessage.includes('Cannot update a component') &&
      (warningMessage.includes('CssInterop') ||
       warningMessage.includes('FormControl') ||
       warningMessage.includes('Input') ||
       warningMessage.includes('Button'))
    ) {
      return;
    }

    originalWarn(...args);
  };

  // Also suppress as errors (sometimes React logs them as errors)
  console.error = (...args) => {
    const errorMessage = args[0]?.toString() || '';

    if (
      errorMessage.includes('Cannot update a component') &&
      (errorMessage.includes('CssInterop') ||
       errorMessage.includes('FormControl') ||
       errorMessage.includes('Input') ||
       errorMessage.includes('Button'))
    ) {
      return;
    }

    originalError(...args);
  };

  // Use LogBox as backup
  LogBox.ignoreLogs([
    'Cannot update a component',
    'CssInterop.View',
    'CssInterop.TextInput',
    'CssInterop.Pressable',
    'CssInterop.Text',
  ]);
}

function RootLayout() {
  console.log('starting in...', process.env.EXPO_PUBLIC_API_URL);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView className="flex-1">
        <AppProviders>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(app)" />
            <Stack.Screen name="index" options={{ headerShown: false }} />
          </Stack>
          <GlobalModals />
          <LoadingScreen />
        </AppProviders>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

export default React.memo(RootLayout);
