/**
 * React hook for preparing form values containing assets before submission
 * Handles uploading new files and cleaning up replaced assets
 */

import { useState, useCallback } from 'react';
import type { GymSpaceSdk } from '@gymspace/sdk';
import type { 
  AssetFieldValue, 
  FormValuesWithAssets, 
  PreparedFormValues,
  PrepareAssetsOptions,
  PrepareAssetsResult,
  PendingAssetValue 
} from '../types/asset-form.types';
import { isPendingAsset, isExistingAsset } from '../types/asset-form.types';

/**
 * Configuration for each asset field
 */
export interface AssetFieldConfig {
  description?: string;
  metadata?: Record<string, any>;
}

/**
 * Hook state for asset preparation
 */
export interface UsePrepareAssetsState {
  isLoading: boolean;
  progress: Record<string, number>;
  errors: Array<{ field: string; error: Error }>;
}

/**
 * Hook return type
 */
export interface UsePrepareAssetsReturn {
  prepareAssets: <T extends Record<string, any>>(
    values: FormValuesWithAssets<T>,
    assetConfigs: Record<string, AssetFieldConfig>,
    options?: PrepareAssetsOptions
  ) => Promise<PrepareAssetsResult<T>>;
  prepareAssetsSimple: <T extends Record<string, any>>(
    values: FormValuesWithAssets<T>,
    assetConfigs: Record<string, AssetFieldConfig>
  ) => Promise<PreparedFormValues<T>>;
  cleanupUploadedAssets: (uploadedAssetIds: string[]) => Promise<void>;
  state: UsePrepareAssetsState;
  resetState: () => void;
}

/**
 * React hook for preparing assets in forms
 * 
 * @param sdk - GymSpace SDK instance
 * @returns Hook functions and state for asset preparation
 * 
 * @example
 * const { prepareAssets, state } = usePrepareAssets(sdk);
 * 
 * const handleSubmit = async (formValues) => {
 *   const result = await prepareAssets(
 *     formValues,
 *     {
 *       photoId: { description: 'Client photo', metadata: { clientId } },
 *       bannerId: { description: 'Gym banner', metadata: { gymId } }
 *     }
 *   );
 *   // Submit result.values to API
 * };
 */
export function usePrepareAssets(sdk: GymSpaceSdk): UsePrepareAssetsReturn {
  const [state, setState] = useState<UsePrepareAssetsState>({
    isLoading: false,
    progress: {},
    errors: []
  });

  const resetState = useCallback(() => {
    setState({
      isLoading: false,
      progress: {},
      errors: []
    });
  }, []);

  const updateProgress = useCallback((field: string, progress: number) => {
    setState(prev => ({
      ...prev,
      progress: {
        ...prev.progress,
        [field]: progress
      }
    }));
  }, []);

  const addError = useCallback((field: string, error: Error) => {
    setState(prev => ({
      ...prev,
      errors: [...prev.errors, { field, error }]
    }));
  }, []);

  const prepareAssets = useCallback(async <T extends Record<string, any>>(
    values: FormValuesWithAssets<T>,
    assetConfigs: Record<string, AssetFieldConfig>,
    options: PrepareAssetsOptions = {}
  ): Promise<PrepareAssetsResult<T>> => {
    const {
      deletePrevious = true,
      continueOnError = false,
      onError,
      onProgress
    } = options;

    setState(prev => ({
      ...prev,
      isLoading: true,
      progress: {},
      errors: []
    }));

    const result: PrepareAssetsResult<T> = {
      values: { ...values } as PreparedFormValues<T>,
      uploaded: [],
      deleted: [],
      errors: []
    };

    try {
      // Process each configured asset field
      for (const [fieldName, config] of Object.entries(assetConfigs)) {
        const fieldValue = values[fieldName] as AssetFieldValue;

        try {
          // Skip if no value or already a string (existing asset)
          if (!fieldValue || isExistingAsset(fieldValue)) {
            continue;
          }

          // Handle pending asset upload
          if (isPendingAsset(fieldValue)) {
            // Report progress
            updateProgress(fieldName, 0);
            onProgress?.(fieldName, 0);

            // Delete previous asset if requested and exists
            if (deletePrevious && fieldValue.prevAssetId) {
              try {
                await sdk.assets.delete(fieldValue.prevAssetId);
                result.deleted.push({
                  field: fieldName,
                  assetId: fieldValue.prevAssetId
                });
              } catch (deleteError) {
                console.warn(`Failed to delete previous asset ${fieldValue.prevAssetId}:`, deleteError);
                // Continue even if deletion fails
              }
            }

            // Upload new asset
            updateProgress(fieldName, 50);
            onProgress?.(fieldName, 50);
            
            const uploadedAsset = await sdk.assets.upload({
              file: fieldValue.file,
              description: config.description,
              metadata: config.metadata
            });
            
            // Update form value with new asset ID
            (result.values as any)[fieldName] = uploadedAsset.id;
            
            result.uploaded.push({
              field: fieldName,
              assetId: uploadedAsset.id,
              asset: uploadedAsset
            });

            updateProgress(fieldName, 100);
            onProgress?.(fieldName, 100);
          }
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          
          result.errors.push({
            field: fieldName,
            error: err
          });

          addError(fieldName, err);
          onError?.(fieldName, err);

          if (!continueOnError) {
            throw new Error(`Failed to prepare asset for field "${fieldName}": ${err.message}`);
          }

          // Set field to null on error
          (result.values as any)[fieldName] = null;
        }
      }

      return result;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [sdk, updateProgress, addError]);

  const prepareAssetsSimple = useCallback(async <T extends Record<string, any>>(
    values: FormValuesWithAssets<T>,
    assetConfigs: Record<string, AssetFieldConfig>
  ): Promise<PreparedFormValues<T>> => {
    const result = await prepareAssets(values, assetConfigs);
    return result.values;
  }, [prepareAssets]);

  const cleanupUploadedAssets = useCallback(async (
    uploadedAssetIds: string[]
  ): Promise<void> => {
    const errors: Error[] = [];

    for (const assetId of uploadedAssetIds) {
      try {
        await sdk.assets.delete(assetId);
      } catch (error) {
        errors.push(error instanceof Error ? error : new Error(String(error)));
      }
    }

    if (errors.length > 0) {
      console.warn('Some assets could not be cleaned up:', errors);
    }
  }, [sdk]);

  return {
    prepareAssets,
    prepareAssetsSimple,
    cleanupUploadedAssets,
    state,
    resetState
  };
}
