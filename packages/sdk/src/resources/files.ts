import { BaseResource } from './base';
import type { FileResponseDto } from '../models/files';

export class FilesResource extends BaseResource {
  /**
   * Upload a new file
   */
  async upload(data: {
    file: File;
    description?: string;
    metadata?: Record<string, any>;
  }): Promise<FileResponseDto> {
    const formData = new FormData();
    formData.append('file', data.file);

    if (data.description) {
      formData.append('description', data.description);
    }

    if (data.metadata) {
      formData.append('metadata', JSON.stringify(data.metadata));
    }

    return await this.client.post<FileResponseDto>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * Get all files for the current user
   */
  async findAll(): Promise<FileResponseDto[]> {
    return await this.client.get<FileResponseDto[]>('/files');
  }

  /**
   * Get a single file by ID
   */
  async findOne(id: string): Promise<FileResponseDto> {
    return await this.client.get<FileResponseDto>(`/files/${id}`);
  }

  /**
   * Get multiple files by IDs
   */
  async findByIds(ids: string[]): Promise<FileResponseDto[]> {
    if (!ids || ids.length === 0) {
      return [];
    }

    // The second parameter of get is the params directly
    return await this.client.get<FileResponseDto[]>('/files/by-ids', {
      ids: ids.join(',')
    });
  }

  /**
   * Delete a file
   */
  async delete(id: string): Promise<void> {
    await this.client.delete(`/files/${id}`);
  }

  /**
   * Download a file as a blob
   */
  async download(id: string): Promise<Blob> {
    const response = await this.client.get<ArrayBuffer>(`/files/${id}/download`, {
      responseType: 'arraybuffer',
    });

    return new Blob([response]);
  }

  /**
   * Get the render URL for a file (for inline display)
   * This returns the URL directly without making an API call
   */
  getRenderUrl(id: string): string {
    return `${this.client.getBaseUrl()}/files/${id}/render`;
  }

  /**
   * Get file blob for rendering/preview
   */
  async render(id: string): Promise<Blob> {
    const response = await this.client.get<ArrayBuffer>(`/files/${id}/render`, {
      responseType: 'arraybuffer',
    });

    return new Blob([response]);
  }
}