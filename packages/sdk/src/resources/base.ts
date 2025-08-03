import { ApiClient } from '../client';
import { RequestOptions, PaginatedResponseDto, PaginationQueryDto } from '../types';

export abstract class BaseResource {
  constructor(protected client: ApiClient) {}

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