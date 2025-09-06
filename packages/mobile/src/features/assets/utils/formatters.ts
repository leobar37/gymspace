/**
 * Utility functions for formatting asset-related data
 */

/**
 * Format file size from bytes to human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number | undefined | null): string => {
  if (!bytes || bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

/**
 * Extract and format file extension from mime type
 * @param mimeType - MIME type string
 * @returns Formatted file type/extension
 */
export const formatFileType = (mimeType: string | undefined | null): string => {
  if (!mimeType) return 'Desconocido';
  
  // Common mime type mappings
  const mimeTypeMap: Record<string, string> = {
    'application/pdf': 'PDF',
    'application/msword': 'DOC',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/vnd.ms-excel': 'XLS',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
    'application/zip': 'ZIP',
    'text/plain': 'TXT',
    'text/csv': 'CSV',
  };
  
  // Check if we have a direct mapping
  if (mimeTypeMap[mimeType]) {
    return mimeTypeMap[mimeType];
  }
  
  // Extract type from mime type (e.g., image/jpeg -> JPEG)
  const parts = mimeType.split('/');
  if (parts.length === 2) {
    return parts[1].toUpperCase();
  }
  
  return 'Archivo';
};

/**
 * Determine if a file is viewable as a preview
 * @param mimeType - MIME type string
 * @returns Boolean indicating if file can be previewed
 */
export const isPreviewableFile = (mimeType: string | undefined | null): boolean => {
  if (!mimeType) return false;
  
  const previewableTypes = [
    'image/',
    'video/',
    'application/pdf',
  ];
  
  return previewableTypes.some(type => mimeType.startsWith(type));
};

/**
 * Get appropriate icon name based on file type
 * @param mimeType - MIME type string
 * @returns Icon name for the file type
 */
export const getFileIcon = (mimeType: string | undefined | null): string => {
  if (!mimeType) return 'FileIcon';
  
  if (mimeType.startsWith('image/')) return 'ImageIcon';
  if (mimeType.startsWith('video/')) return 'VideoIcon';
  if (mimeType === 'application/pdf') return 'FileTextIcon';
  if (mimeType.startsWith('audio/')) return 'MusicIcon';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'TableIcon';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'FileTextIcon';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return 'ArchiveIcon';
  
  return 'FileIcon';
};