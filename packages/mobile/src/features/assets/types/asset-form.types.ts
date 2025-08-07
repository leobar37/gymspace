/**
 * Type definitions for asset form field values
 */

import type { AssetResponseDto } from '@gymspace/sdk';

/**
 * Represents a pending file upload with optional reference to previous asset
 */
export interface PendingAssetValue {
  file: File;
  prevAssetId?: string; // ID of asset to delete when replacing
}

/**
 * Asset field value can be:
 * - string: Existing asset ID reference
 * - PendingAssetValue: New file to upload
 * - null/undefined: No asset
 */
export type AssetFieldValue = string | PendingAssetValue | null | undefined;

/**
 * Form values that may contain asset fields
 */
export type FormValuesWithAssets<T extends Record<string, any> = Record<string, any>> = {
  [K in keyof T]: T[K] extends AssetFieldValue ? AssetFieldValue : T[K];
};

/**
 * Result of asset preparation - all asset fields are converted to strings
 */
export type PreparedFormValues<T extends Record<string, any> = Record<string, any>> = {
  [K in keyof T]: T[K] extends AssetFieldValue ? string | null : T[K];
};

/**
 * Options for asset preparation
 */
export interface PrepareAssetsOptions {
  /**
   * Whether to delete previous assets when replacing
   * @default true
   */
  deletePrevious?: boolean;
  
  /**
   * Whether to continue on error or throw
   * @default false
   */
  continueOnError?: boolean;
  
  /**
   * Custom error handler for failed uploads
   */
  onError?: (field: string, error: Error) => void;
  
  /**
   * Progress callback for tracking upload status
   */
  onProgress?: (field: string, progress: number) => void;
}

/**
 * Result of asset preparation with detailed information
 */
export interface PrepareAssetsResult<T extends Record<string, any> = Record<string, any>> {
  /**
   * Form values with all assets converted to string IDs
   */
  values: PreparedFormValues<T>;
  
  /**
   * Assets that were successfully uploaded
   */
  uploaded: Array<{
    field: string;
    assetId: string;
    asset: AssetResponseDto;
  }>;
  
  /**
   * Assets that were deleted during replacement
   */
  deleted: Array<{
    field: string;
    assetId: string;
  }>;
  
  /**
   * Errors that occurred during processing
   */
  errors: Array<{
    field: string;
    error: Error;
  }>;
}

/**
 * Helper type to check if a value is a pending asset
 */
export function isPendingAsset(value: any): value is PendingAssetValue {
  return (
    value !== null &&
    typeof value === 'object' &&
    'file' in value &&
    value.file instanceof File
  );
}

/**
 * Helper type to check if a value is an existing asset ID
 */
export function isExistingAsset(value: any): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Asset metadata for form field configuration
 */
export interface AssetFieldConfig {
  /**
   * Entity type for the asset
   */
  entityType: string;
  
  /**
   * Entity ID for the asset
   */
  entityId: string;
  
  /**
   * Optional description for the asset
   */
  description?: string;
  
  /**
   * Optional metadata for the asset
   */
  metadata?: Record<string, any>;
}