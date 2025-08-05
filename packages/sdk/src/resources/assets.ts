import { BaseResource } from './base';
import { 
  AssetResponseDto, 
  UploadAssetDto,
  AssetDownloadUrl,
  AssetEntityType
} from '../models/assets';
import { RequestOptions } from '../types';

export class AssetsResource extends BaseResource {
  private basePath = 'assets';

  async upload(data: UploadAssetDto, options?: RequestOptions): Promise<AssetResponseDto> {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('entityType', data.entityType);
    formData.append('entityId', data.entityId);
    
    if (data.description) {
      formData.append('description', data.description);
    }
    
    if (data.metadata) {
      formData.append('metadata', JSON.stringify(data.metadata));
    }

    return this.client.post<AssetResponseDto>(
      `${this.basePath}/upload`,
      formData,
      {
        ...options,
        headers: {
          ...options?.headers,
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  }

  async findOne(id: string, options?: RequestOptions): Promise<AssetResponseDto> {
    return this.client.get<AssetResponseDto>(`${this.basePath}/${id}`, undefined, options);
  }

  async delete(id: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(`${this.basePath}/${id}`, options);
  }

  async getDownloadUrl(id: string, options?: RequestOptions): Promise<AssetDownloadUrl> {
    return this.client.get<AssetDownloadUrl>(
      `${this.basePath}/${id}/download-url`,
      undefined,
      options
    );
  }

  async download(id: string, options?: RequestOptions): Promise<Blob> {
    const response = await this.client.request<ArrayBuffer>(
      'GET',
      `${this.basePath}/${id}/download`,
      undefined,
      {
        ...options,
        responseType: 'arraybuffer',
      }
    );
    return new Blob([response]);
  }

  async findByEntity(
    entityType: AssetEntityType,
    entityId: string,
    options?: RequestOptions
  ): Promise<AssetResponseDto[]> {
    return this.client.get<AssetResponseDto[]>(
      `${this.basePath}/entity/${entityType}/${entityId}`,
      undefined,
      options
    );
  }

  /**
   * Get render URL for displaying an asset inline (images, PDFs, etc.)
   * This URL can be used directly in img tags or iframes
   */
  getRenderUrl(id: string): string {
    // Note: This returns the URL directly without making a request
    // The actual request will be made by the browser when loading the asset
    const baseUrl = this.client.getBaseUrl();
    return `${baseUrl}${this.basePath}/${id}/render`;
  }

  /**
   * Render/preview an asset (returns blob for inline display)
   */
  async render(id: string, options?: RequestOptions): Promise<Blob> {
    const response = await this.client.request<ArrayBuffer>(
      'GET',
      `${this.basePath}/${id}/render`,
      undefined,
      {
        ...options,
        responseType: 'arraybuffer',
      }
    );
    return new Blob([response]);
  }
}