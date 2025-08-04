import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { AppProviders } from "@/providers/AppProviders";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../../global.css";

export default function RootLayout() {
  useEffect(() => {
    // Any global setup can go here
  }, []);

  return (
    <GluestackUIProvider mode="light"><GestureHandlerRootView className="flex-1">
      <AppProviders>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(app)" />
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="test-nativewind" options={{ title: "Test NativeWind", headerShown: true }} />
        </Stack>
      </AppProviders>
    </GestureHandlerRootView></GluestackUIProvider>
  );
}