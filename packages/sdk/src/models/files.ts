// File-related DTOs

export interface FileResponseDto {
  id: string;
  filename: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  status: 'active' | 'deleted';
  metadata?: Record<string, any>;
  description?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  previewUrl: string | null;
}

export interface UploadFileDto {
  file: File;
  description?: string;
  metadata?: Record<string, any>;
}