import { AppProviders } from "@/providers/AppProviders";
import { Stack } from "expo-router";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../../global.css";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";

function RootLayout() {
  return (
    <GluestackUIProvider>
      <SafeAreaProvider>
        <GestureHandlerRootView className="flex-1">
          <AppProviders>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(onboarding)" />
              <Stack.Screen name="(app)" />
              <Stack.Screen name="index" options={{ headerShown: false }} />
            </Stack>
          </AppProviders>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </GluestackUIProvider>

  );
}

export default React.memo(RootLayout);