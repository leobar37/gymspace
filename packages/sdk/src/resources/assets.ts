import { BaseResource } from './base';
import type { AssetResponseDto } from '../models/assets';

export class AssetsResource extends BaseResource {
  /**
   * Upload a new asset
   */
  async upload(data: {
    file: File;
    description?: string;
    metadata?: Record<string, any>;
  }): Promise<AssetResponseDto> {
    const formData = new FormData();
    formData.append('file', data.file);
    
    if (data.description) {
      formData.append('description', data.description);
    }
    
    if (data.metadata) {
      formData.append('metadata', JSON.stringify(data.metadata));
    }

    return await this.client.post<AssetResponseDto>('/assets/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * Get a single asset by ID
   */
  async findOne(id: string): Promise<AssetResponseDto> {
    return await this.client.get<AssetResponseDto>(`/assets/${id}`);
  }

  /**
   * Get multiple assets by IDs
   */
  async findByIds(ids: string[]): Promise<AssetResponseDto[]> {
    return await this.client.get<AssetResponseDto[]>('/assets/list/by-ids', {
      params: { ids: ids.join(',') },
    });
  }

  /**
   * Delete an asset
   */
  async delete(id: string): Promise<void> {
    await this.client.delete(`/assets/${id}`);
  }

  /**
   * Get a signed download URL for an asset
   */
  async getDownloadUrl(id: string): Promise<{ url: string; filename: string }> {
    return await this.client.get<{ url: string; filename: string }>(
      `/assets/${id}/download-url`
    );
  }

  /**
   * Download an asset as a blob
   */
  async download(id: string): Promise<Blob> {
    const response = await this.client.get<ArrayBuffer>(`/assets/${id}/download`, {
      responseType: 'arraybuffer',
    });
    
    return new Blob([response]);
  }

  /**
   * Get the render URL for an asset (for inline display)
   * This returns the URL directly without making an API call
   */
  getRenderUrl(id: string): string {
    return `${this.client.getBaseUrl()}/assets/${id}/render`;
  }

  /**
   * Get asset blob for rendering/preview
   */
  async render(id: string): Promise<Blob> {
    const response = await this.client.get<ArrayBuffer>(`/assets/${id}/render`, {
      responseType: 'arraybuffer',
    });
    
    return new Blob([response]);
  }
}