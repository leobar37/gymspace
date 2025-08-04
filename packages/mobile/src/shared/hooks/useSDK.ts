import { useMemo } from 'react';
import { GymSpaceSdk } from '@gymspace/sdk';
import { useAtom } from 'jotai';
import { accessTokenAtom } from '@/shared/stores/auth.store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const useSDK = () => {
  const [accessToken] = useAtom(accessTokenAtom);

  const gymSpaceSDK = useMemo(() => {
    const sdk = new GymSpaceSdk({
      baseURL: API_BASE_URL,
      apiKey: accessToken || undefined,
    });

    return sdk;
  }, [accessToken]);

  return { gymSpaceSDK };
};