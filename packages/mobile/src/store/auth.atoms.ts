import { atom } from 'jotai';
import { atomWithStorage, createJSONStorage } from 'jotai/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CurrentSessionResponse } from '@gymspace/sdk';

// Create async storage adapter - stores everything as JSON string
const asyncStorageAdapter = createJSONStorage(() => ({
  getItem: async (key: string) => {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    await AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    await AsyncStorage.removeItem(key);
  },
}));

// Auth state interface
export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  currentGymId: string | null;
}

// Initial auth state
const initialAuthState: AuthState = {
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
  currentGymId: null,
};

// Create auth atom with async storage - stores everything as a single JSON
export const authAtom = atomWithStorage<AuthState>(
  'authState',
  initialAuthState,
  asyncStorageAdapter as any,
  {
    getOnInit: true, // Load immediately on mount
  }
);

// Derived atoms for easy access - handle async nature of storage
export const isAuthenticatedAtom = atom(async (get) => {
  const auth = await get(authAtom);
  return !!(auth.accessToken && (!auth.expiresAt || auth.expiresAt > Date.now()));
});

export const accessTokenAtom = atom(async (get) => {
  const auth = await get(authAtom);
  return auth.accessToken;
});

export const currentGymIdAtom = atom(async (get) => {
  const auth = await get(authAtom);
  return auth.currentGymId;
});

// Session atom
export const sessionAtom = atom<CurrentSessionResponse | null>(null);

// Loading state atom
export const authLoadingAtom = atom(true);

// SDK clear callback atom - stores a function to clear SDK auth
export const sdkClearCallbackAtom = atom<(() => void) | null>(null);

// Auth failure tracking - global variables, not atoms
export let authFailureCount = 0;
export let hasReachedMaxFailures = false;

export function resetAuthFailureTracking() {
  authFailureCount = 0;
  hasReachedMaxFailures = false;
}

export function incrementAuthFailureCount() {
  authFailureCount++;
  if (authFailureCount >= 4) {
    hasReachedMaxFailures = true;
  }
  return authFailureCount;
}

// Helper atoms for auth operations
export const setAuthTokensAtom = atom(
  null,
  async (get, set, { accessToken, refreshToken, expiresAt }: Partial<AuthState>) => {
    const prev = await get(authAtom);
    set(authAtom, {
      ...prev,
      ...(accessToken !== undefined && { accessToken }),
      ...(refreshToken !== undefined && { refreshToken }),
      ...(expiresAt !== undefined && { expiresAt }),
    });
  }
);

export const setCurrentGymIdAtom = atom(
  null,
  async (get, set, gymId: string | null) => {
    const prev = await get(authAtom);
    set(authAtom, {
      ...prev,
      currentGymId: gymId,
    });
  }
);

export const clearAuthAtom = atom(null, async (get, set) => {
  // Clear auth state in async storage
  await set(authAtom, initialAuthState);
  // Clear session state
  set(sessionAtom as any, null);
  // Reset auth failure tracking
  resetAuthFailureTracking();
  
  // Clear SDK auth if callback is available
  const sdkClearCallback = get(sdkClearCallbackAtom);
  if (sdkClearCallback) {
    sdkClearCallback();
  }
});