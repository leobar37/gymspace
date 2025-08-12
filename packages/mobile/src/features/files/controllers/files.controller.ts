import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useGymSdk } from '@/providers/GymSdkProvider';
import type { FileResponseDto } from '@gymspace/sdk';
import { Alert } from 'react-native';

/**
 * React Query key factory for files
 */
export const filesKeys = {
  all: ['files'] as const,
  lists: () => [...filesKeys.all, 'list'] as const,
  detail: (id: string) => ['files', id] as const,
  byIds: (ids: string[]) => ['files', 'byIds', ids] as const,
};

/**
 * Hook to fetch a single file by ID
 */
export function useFile(id: string, enabled = true) {
  const { sdk } = useGymSdk();

  return useQuery({
    queryKey: filesKeys.detail(id),
    queryFn: () => sdk.files.findOne(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch multiple files by IDs
 */
export function useFilesByIds(ids: string[]) {
  const { sdk } = useGymSdk();

  return useQuery({
    queryKey: filesKeys.byIds(ids),
    queryFn: () => sdk.files.findByIds(ids),
    enabled: ids.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to upload a file
 */
export function useUploadFile() {
  const { sdk } = useGymSdk();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      file: File;
      description?: string;
      metadata?: Record<string, any>;
    }) => {
      return sdk.files.upload(data);
    },
    onSuccess: (data) => {
      // Invalidate files cache
      queryClient.invalidateQueries({ queryKey: filesKeys.all });
      // Set the new file data in cache
      queryClient.setQueryData(filesKeys.detail(data.id), data);
    },
    onError: (error: any) => {
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Error al subir el archivo'
      );
    },
  });
}

/**
 * Hook to delete a file
 */
export function useDeleteFile() {
  const { sdk } = useGymSdk();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return sdk.files.delete(id);
    },
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: filesKeys.detail(id) });
      // Invalidate all files queries
      queryClient.invalidateQueries({ queryKey: filesKeys.all });
    },
    onError: (error: any) => {
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Error al eliminar el archivo'
      );
    },
  });
}

/**
 * Hook to fetch all user files
 */
export function useAllFiles(enabled = true) {
  const { sdk } = useGymSdk();

  return useQuery({
    queryKey: filesKeys.lists(),
    queryFn: async () => {
      const response = await sdk.files.findAll();
      return response || [];
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get the render URL for a file (for preview)
 */
export function useFileRenderUrl(id: string | null | undefined) {
  const { sdk } = useGymSdk();
  
  if (!id) return null;
  
  return sdk.files.getRenderUrl(id);
}

/**
 * Hook to download a file
 */
export function useDownloadFile() {
  const { sdk } = useGymSdk();

  return useMutation({
    mutationFn: async (id: string) => {
      return sdk.files.download(id);
    },
    onError: (error: any) => {
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Error al descargar el archivo'
      );
    },
  });
}

/**
 * Controller for file operations
 */
export function useFilesController() {
  const uploadFile = useUploadFile();
  const deleteFile = useDeleteFile();
  const downloadFile = useDownloadFile();

  return {
    // Queries
    useFile,
    useFilesByIds,
    useFileRenderUrl,
    
    // Mutations
    uploadFile: uploadFile.mutateAsync,
    deleteFile: deleteFile.mutateAsync,
    downloadFile: downloadFile.mutateAsync,
    
    // Loading states
    isUploading: uploadFile.isPending,
    isDeleting: deleteFile.isPending,
    isDownloading: downloadFile.isPending,
  };
}