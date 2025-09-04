import { useCallback } from 'react';
import { useAtom, useSetAtom, useAtomValue } from 'jotai';
import { useGymSdk } from '@/providers/GymSdkProvider';
import { 
  authAtom,
  setAuthTokensAtom,
  clearAuthAtom,
  isAuthenticatedAtom,
  accessTokenAtom
} from '@/store/auth.atoms';

export interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export function useAuthToken() {
  const { sdk } = useGymSdk();
  const authState = useAtomValue(authAtom);
  const setTokens = useSetAtom(setAuthTokensAtom);
  const clearAuth = useSetAtom(clearAuthAtom);
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);

  /**
   * Store authentication tokens
   */
  const storeTokens = useCallback(
    async (tokenData: TokenData): Promise<boolean> => {
      try {
        // Update Jotai atom
        setTokens({
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken,
          expiresAt: tokenData.expiresAt,
        });

        // Update SDK with new token
        if (tokenData.refreshToken) {
          sdk.setTokens(tokenData.accessToken, tokenData.refreshToken);
        } else {
          sdk.setAuthToken(tokenData.accessToken);
        }

        return true;
      } catch (error) {
        console.error('Failed to store auth tokens:', error);
        return false;
      }
    },
    [setTokens, sdk],
  );

  /**
   * Retrieve stored authentication token
   */
  const getStoredToken = useCallback((): string | null => {
    // Check if token is expired
    if (authState.expiresAt && Date.now() > authState.expiresAt) {
      // Token is expired, clear it
      clearAuth();
      return null;
    }
    return authState.accessToken;
  }, [authState, clearAuth]);

  /**
   * Get refresh token
   */
  const getRefreshToken = useCallback((): string | null => {
    return authState.refreshToken;
  }, [authState.refreshToken]);

  /**
   * Check if token exists and is valid
   */
  const hasValidToken = useCallback((): boolean => {
    return isAuthenticated;
  }, [isAuthenticated]);

  /**
   * Clear all stored authentication data
   */
  const clearStoredTokens = useCallback((): boolean => {
    try {
      clearAuth();
      sdk.clearAuth();
      return true;
    } catch (error) {
      console.error('Failed to clear auth tokens:', error);
      return false;
    }
  }, [clearAuth, sdk]);

  /**
   * Refresh expired token
   */
  const refreshToken = useCallback(async (): Promise<TokenData | null> => {
    try {
      const refreshTokenValue = getRefreshToken();
      if (!refreshTokenValue) {
        throw new Error('No refresh token available');
      }
      
      // Call SDK refresh endpoint with the refresh token
      const response = await sdk.auth.refreshToken(refreshTokenValue);
      const tokenData: TokenData = {
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour default
      };

      // Store new tokens
      await storeTokens(tokenData);

      return tokenData;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      // Clear invalid tokens
      clearStoredTokens();
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