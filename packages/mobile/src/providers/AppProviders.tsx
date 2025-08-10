import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { ConfigProvider } from "@/config/ConfigContext";
import { CartProvider } from "@/contexts/CartContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider } from "jotai";
import React from "react";
import { GymSdkProvider } from "./GymSdkProvider";
import { GlobalAssetModal } from "@/features/assets/components/GlobalAssetModal";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Network retry configuration
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch configuration
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',

      // Cache configuration (v5 best practices)
      staleTime: 2 * 60 * 1000,    // 2 minutes - data is fresh
      gcTime: 10 * 60 * 1000,      // 10 minutes - garbage collection (formerly cacheTime)

      // Background refetch
      refetchInterval: false,
      refetchIntervalInBackground: false,
    },
    mutations: {
      retry: 0,
      // Optimistic updates will be handled per-mutation
    },
  },
});

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <GluestackUIProvider >
      <QueryClientProvider client={queryClient}>
        <JotaiProvider>
          <GymSdkProvider>
            <ConfigProvider>
              <CartProvider>
                {children}
                {/* Global Asset Modal - rendered once at app level */}
                <GlobalAssetModal />
              </CartProvider>
            </ConfigProvider>
          </GymSdkProvider>
        </JotaiProvider>
      </QueryClientProvider>
    </GluestackUIProvider>
  );
}