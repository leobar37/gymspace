/**
 * Asset models for file management
 */

export interface UploadAssetDto {
  file: File;
  description?: string;
  metadata?: Record<string, any>;
}

export interface AssetResponseDto {
  id: string;
  filename: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  status: 'active' | 'deleted';
  description?: string;
  metadata?: Record<string, any>;
  previewUrl?: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}