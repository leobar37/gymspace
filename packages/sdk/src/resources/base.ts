import { ApiClient } from '../client';
import { RequestOptions, PaginatedResponseDto, PaginationQueryDto } from '../types';

export abstract class BaseResource {
  constructor(protected client: ApiClient) {}

  protected async request<T>(
    path: string,
    options: {
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      body?: string;
      headers?: Record<string, string>;
    }
  ): Promise<T> {
    const data = options.body ? JSON.parse(options.body) : undefined;
    
    switch (options.method) {
      case 'GET':
        return this.client.get<T>(path, data, { headers: options.headers });
      case 'POST':
        return this.client.post<T>(path, data, { headers: options.headers });
      case 'PUT':
        return this.client.put<T>(path, data, { headers: options.headers });
      case 'PATCH':
        return this.client.patch<T>(path, data, { headers: options.headers });
      case 'DELETE':
        return this.client.delete<T>(path, { headers: options.headers });
      default:
        throw new Error(`Unsupported HTTP method: ${options.method}`);
    }
  }

  protected buildPath(base: string, ...segments: (string | undefined)[]): string {
    const parts = [base];
    for (const segment of segments) {
      if (segment !== undefined) {
        parts.push(segment);
      }
    }
    return parts.join('/');
  }

  protected async paginate<T>(
    path: string,
    params?: PaginationQueryDto & Record<string, any>,
    options?: RequestOptions
  ): Promise<PaginatedResponseDto<T>> {
    return this.client.get<PaginatedResponseDto<T>>(path, params, options);
  }
}