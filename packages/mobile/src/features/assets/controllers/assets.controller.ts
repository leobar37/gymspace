import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useGymSdk } from '@/providers/GymSdkProvider';

/**
 * Query keys for assets
 */
export const assetsKeys = {
  all: ['assets'] as const,
  lists: () => [...assetsKeys.all, 'list'] as const,
  list: (entityType: string, entityId: string) =>
    [...assetsKeys.lists(), { entityType, entityId }] as const,
  details: () => [...assetsKeys.all, 'detail'] as const,
  detail: (id: string) => [...assetsKeys.details(), id] as const,
};

/**
 * Hook to upload an asset
 */
export function useUploadAsset() {
  const sdk = useGymSdk();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      file: File;
      description?: string;
      metadata?: Record<string, any>;
    }) => {
      return await sdk.sdk.assets.upload(data);
    },
    onSuccess: () => {
      // Also invalidate all lists in case they're being viewed
      queryClient.invalidateQueries({
        queryKey: assetsKeys.lists(),
      });
    },
    onError: (error) => {
      console.error('Error uploading asset:', error);
    },
  });
}

/**
 * Hook to get all assets for the current gym
 */
export function useAllAssets(enabled = true) {
  const sdk = useGymSdk();

  return useQuery({
    queryKey: assetsKeys.lists(),
    queryFn: async () => {
      return await sdk.sdk.assets.findAll();
    },
    enabled: enabled && !sdk.isLoading && sdk.isAuthenticated,
  });
}

/**
 * Hook to get multiple assets by IDs
 */
export function useAssetsByIds(assetIds: string[], enabled = true) {
  const sdk = useGymSdk();

  return useQuery({
    queryKey: ['assets', 'byIds', ...assetIds],
    queryFn: async () => {
      if (!assetIds || assetIds.length === 0) {
        return [];
      }
      
      // Filter out any empty or invalid IDs
      const validIds = assetIds.filter(id => id && typeof id === 'string' && id.trim().length > 0);
      
      if (validIds.length === 0) {
        return [];
      }
      
      return await sdk.sdk.assets.findByIds(validIds);
    },
    enabled: Boolean(enabled && assetIds.length > 0 && !sdk.isLoading && sdk.isAuthenticated),
    staleTime: 0, // Always refetch
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

/**
 * Hook to get a single asset
 */
export function useAsset(assetId: string, enabled = true) {
  const sdk = useGymSdk();
  return useQuery({
    queryKey: assetsKeys.detail(assetId),
    queryFn: async () => {
      return await sdk.sdk.assets.findOne(assetId);
    },
    enabled: enabled && !!assetId && !sdk.isLoading && sdk.isAuthenticated,
  });
}

/**
 * Hook to delete an asset
 */
export function useDeleteAsset() {
  const sdk = useGymSdk();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assetId: string) => {
      return await sdk.sdk.assets.delete(assetId);
    },
    onSuccess: (_, assetId) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: assetsKeys.detail(assetId),
      });
      // Invalidate all lists as we don't know which entity it belonged to
      queryClient.invalidateQueries({
        queryKey: assetsKeys.lists(),
      });
    },
    onError: (error) => {
      console.error('Error deleting asset:', error);
    },
  });
}

/**
 * Hook to get download URL for an asset
 */
export function useAssetDownloadUrl(assetId: string, enabled = true) {
  const sdk = useGymSdk();

  return useQuery({
    queryKey: [...assetsKeys.detail(assetId), 'downloadUrl'],
    queryFn: async () => {
      return await sdk.sdk.assets.getDownloadUrl(assetId);
    },
    enabled: enabled && !!assetId,
    staleTime: 5 * 60 * 1000, // URLs are valid for a while, cache for 5 minutes
  });
}

/**
 * Hook to download an asset as blob
 */
export function useDownloadAsset() {
  const sdk = useGymSdk();

  return useMutation({
    mutationFn: async (assetId: string) => {
      return await sdk.sdk.assets.download(assetId);
    },
    onError: (error) => {
      console.error('Error downloading asset:', error);
    },
  });
}

/**
 * Hook to get render URL for an asset (for preview)
 */
export function useAssetRenderUrl(assetId: string | null | undefined) {
  const sdk = useGymSdk();
  
  // Return null if no assetId provided
  if (!assetId) {
    return null;
  }
  
  // Only generate URL if we have a valid ID and SDK is ready
  if (sdk.isLoading || !sdk.isAuthenticated) {
    return null;
  }
  
  return sdk.sdk.assets.getRenderUrl(assetId);
}

/**
 * Helper to create an upload handler for PhotoField
 * @param uploadMutation - The upload mutation hook
 * @param metadata - Optional metadata to attach to the asset
 */
export function createAssetUploadHandler(
  uploadMutation: ReturnType<typeof useUploadAsset>,
  metadata?: Record<string, any>
) {
  return async (file: File | Blob): Promise<string> => {
    const result = await uploadMutation.mutateAsync({
      file: file as File,
      metadata,
    });

    // Return the asset ID to store in the form
    return result.id;
  };
}
