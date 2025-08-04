import { useCallback } from 'react';
import { useSecureStorage } from '@/hooks/useSecureStorage';
import { useGymSdk } from '@/providers/GymSdkProvider';

export interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export function useAuthToken() {
  const { getItem, setItem, removeItem } = useSecureStorage();
  const { sdk, setAuthToken: setSdkToken, clearAuth } = useGymSdk();

  /**
   * Store authentication tokens securely
   */
  const storeTokens = useCallback(async (tokenData: TokenData): Promise<boolean> => {
    try {
      // Store individual tokens
      await setItem('authToken', tokenData.accessToken);
      
      if (tokenData.refreshToken) {
        await setItem('refreshToken', tokenData.refreshToken);
      }
      
      if (tokenData.expiresAt) {
        await setItem('tokenExpiresAt', tokenData.expiresAt.toString());
      }

      // Update SDK with new token
      await setSdkToken(tokenData.accessToken);
      
      return true;
    } catch (error) {
      console.error('Failed to store auth tokens:', error);
      return false;
    }
  }, [setItem, setSdkToken]);

  /**
   * Retrieve stored authentication token
   */
  const getStoredToken = useCallback(async (): Promise<string | null> => {
    try {
      const token = await getItem('authToken');
      
      // Check if token is expired
      if (token) {
        const expiresAtStr = await getItem('tokenExpiresAt');
        if (expiresAtStr) {
          const expiresAt = parseInt(expiresAtStr, 10);
          if (Date.now() > expiresAt) {
            // Token is expired, clear it
            await clearStoredTokens();
            return null;
          }
        }
      }
      
      return token;
    } catch (error) {
      console.error('Failed to retrieve auth token:', error);
      return null;
    }
  }, [getItem]);

  /**
   * Get refresh token
   */
  const getRefreshToken = useCallback(async (): Promise<string | null> => {
    try {
      return await getItem('refreshToken');
    } catch (error) {
      console.error('Failed to retrieve refresh token:', error);
      return null;
    }
  }, [getItem]);

  /**
   * Check if token exists and is valid
   */
  const hasValidToken = useCallback(async (): Promise<boolean> => {
    const token = await getStoredToken();
    return !!token;
  }, [getStoredToken]);

  /**
   * Clear all stored authentication data
   */
  const clearStoredTokens = useCallback(async (): Promise<boolean> => {
    try {
      await Promise.all([
        removeItem('authToken'),
        removeItem('refreshToken'),
        removeItem('tokenExpiresAt'),
      ]);
      
      // Clear SDK auth
      await clearAuth();
      
      return true;
    } catch (error) {
      console.error('Failed to clear auth tokens:', error);
      return false;
    }
  }, [removeItem, clearAuth]);

  /**
   * Refresh expired token
   */
  const refreshToken = useCallback(async (): Promise<TokenData | null> => {
    try {
      const refreshTokenValue = await getRefreshToken();
      if (!refreshTokenValue) {
        throw new Error('No refresh token available');
      }

      // Call SDK refresh endpoint
      const response = await sdk.auth.refreshToken();
      
      const tokenData: TokenData = {
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        // Set expiration to 1 hour from now if not provided
        expiresAt: Date.now() + (60 * 60 * 1000),
      };

      // Store new tokens
      await storeTokens(tokenData);
      
      return tokenData;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      // Clear invalid tokens
      await clearStoredTokens();
      return null;
    }
  }, [sdk.auth, getRefreshToken, storeTokens, clearStoredTokens]);

  return {
    storeTokens,
    getStoredToken,
    getRefreshToken,
    hasValidToken,
    clearStoredTokens,
    refreshToken,
  };
}