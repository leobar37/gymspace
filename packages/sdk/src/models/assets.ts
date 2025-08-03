export interface AssetResponseDto {
  id: string;
  filename: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  entityType: string;
  entityId: string;
  status: 'active' | 'deleted';
  metadata?: Record<string, any>;
  description?: string;
  createdAt: string;
  updatedAt: string;
  uploadedBy: any;
  previewUrl?: string;
}

export interface UploadAssetDto {
  file: File;
  entityType: AssetEntityType;
  entityId: string;
  description?: string;
  metadata?: Record<string, any>;
}

export type AssetEntityType = 'gym' | 'user' | 'contract' | 'evaluation' | 'client' | 'collaborator';

export interface AssetDownloadUrl {
  url: string;
  filename: string;
}