import { atom } from 'jotai';
import { atomWithStorage, createJSONStorage } from 'jotai/utils';
import * as SecureStore from 'expo-secure-store';
import type { CurrentSessionResponse } from '@gymspace/sdk';

// Create secure storage adapter - stores everything as JSON string
const secureStorage = createJSONStorage(() => ({
  getItem: async (key: string) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    await SecureStore.deleteItemAsync(key);
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

// Create auth atom with secure storage - stores everything as a single JSON
export const authAtom = atomWithStorage<AuthState>(
  'authState',
  initialAuthState,
  secureStorage as any,
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

export const clearAuthAtom = atom(null, (get, set) => {
  set(authAtom, initialAuthState);
  set(sessionAtom as any, null);
});