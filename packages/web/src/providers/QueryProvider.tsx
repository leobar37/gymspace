'use client';

import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter, usePathname } from 'next/navigation';
import React, { useState } from 'react';

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [queryClient] = useState(() => {
    const queryCache = new QueryCache({
      onError: async (error: any, query) => {
        if (error?.statusCode === 401 || error?.statusCode === 403) {
          console.log('Authentication error detected, redirecting to login');
          try {
            if (!pathname?.includes('/login')) {
              router.replace('/login');
              queryClient.clear();
            }
          } catch (error) {
            console.error('Error redirecting to login:', error);
          }
          return;
        }

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
          retry: (failureCount, error: any) => {
            if (error?.response?.status === 401 || error?.response?.status === 403) {
              return false;
            }
            return failureCount < 2;
          },
          retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          refetchOnWindowFocus: false,
          refetchOnReconnect: 'always',
          staleTime: 2 * 60 * 1000, // 2 minutes
          gcTime: 10 * 60 * 1000, // 10 minutes
          refetchInterval: false,
          refetchIntervalInBackground: false,
        },
        mutations: {
          retry: 0,
          onError: (error: any) => {
            console.log("Mutation error:", error);
            
            if (error?.response?.status === 401 || error?.response?.status === 403) {
              queryClient.clear();
              
              if (!pathname?.includes('/login')) {
                router.replace('/login');
              }
              return;
            }

            console.error('Mutation error:', error?.message || error);
          },
        },
      },
    });
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}