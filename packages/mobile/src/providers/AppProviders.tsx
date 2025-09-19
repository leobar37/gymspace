import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { ConfigProvider } from '@/config/ConfigContext';
import { CartProvider } from '@/contexts/CartContext';
import { SessionProvider } from '@/contexts/SessionContext';
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter, useSegments } from 'expo-router';
import { LoadingScreen } from '@/shared/loading-screen/LoadingScreen';
import { SheetManager, SheetProvider, SheetsRenderer } from '@gymspace/sheet';
import '../sheets';
import React, { useState } from 'react';
import { Alert } from 'react-native';
import { GymSdkProvider } from './GymSdkProvider';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const router = useRouter();
  const segments = useSegments();
  // Create QueryClient inside component with useState to ensure single instance
  const [queryClient] = useState(() => {
    // Create QueryCache with error handling
    const queryCache = new QueryCache({
      onError: async (error: any, query) => {
        // Check for authentication errors
        if (error?.statusCode === 401 || error?.statusCode === 403) {
          // Clear all queries
          console.log('pass here to login', {
            segments,
          });
          try {
            router.replace('(onboarding)/login');
          } catch (error) {
            console.log('error to login', error);
          }
          return;
        }

        // Log other errors for debugging
        console.error('Query error:', {
          queryKey: query.queryKey,
          error: error?.message || error,
        });
      },
    });

    return new QueryClient({
      queryCache,
      defaultOptions: {
        queries: {
          // Network retry configuration
          retry: (failureCount, error: any) => {
            // Don't retry on authentication errors
            if (error?.response?.status === 401 || error?.response?.status === 403) {
              return false;
            }
            // Retry up to 2 times for other errors
            return failureCount < 2;
          },
          retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

          // Refetch configuration
          refetchOnWindowFocus: false,
          refetchOnReconnect: 'always',

          // Cache configuration (v5 best practices)
          staleTime: 2 * 60 * 1000, // 2 minutes - data is fresh
          gcTime: 10 * 60 * 1000, // 10 minutes - garbage collection (formerly cacheTime)

          // Background refetch
          refetchInterval: false,
          refetchIntervalInBackground: false,
        },
        mutations: {
          retry: 0,
          // Global mutation error handling
          onError: (error: any) => {
            // Check for authentication errors in mutations
            if (error?.response?.status === 401 || error?.response?.status === 403) {
              // Show error message
              Alert.alert(
                'Sesión Expirada',
                'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Navigate to login screen
                      router.replace('/login');
                    },
                  },
                ],
                { cancelable: false },
              );
              return;
            }

            // Log other mutation errors
            console.error('Mutation error:', error?.message || error);
          },
        },
      },
    });
  });

  console.log('items', SheetManager.sheets.values());

  return (
    <QueryClientProvider client={queryClient}>
      <GymSdkProvider>
        <SessionProvider>
          <GluestackUIProvider>
            <ConfigProvider>
              <CartProvider>
                <SheetProvider>
                  {children}
                  <LoadingScreen />
                  <SheetsRenderer />
                </SheetProvider>
              </CartProvider>
            </ConfigProvider>
          </GluestackUIProvider>
        </SessionProvider>
      </GymSdkProvider>
    </QueryClientProvider>
  );
}
