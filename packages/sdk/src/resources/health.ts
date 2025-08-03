import { BaseResource } from './base';
import { RequestOptions } from '../types';

export interface HealthResponse {
  status: string;
  timestamp: string;
}

export interface ReadyResponse {
  status: string;
  services: {
    database: boolean;
    cache: boolean;
    storage: boolean;
  };
}

export class HealthResource extends BaseResource {
  private basePath = '/api/v1/v1/health';

  async health(options?: RequestOptions): Promise<HealthResponse> {
    return this.client.get<HealthResponse>(this.basePath, undefined, options);
  }

  async ready(options?: RequestOptions): Promise<ReadyResponse> {
    return this.client.get<ReadyResponse>(`${this.basePath}/ready`, undefined, options);
  }
}