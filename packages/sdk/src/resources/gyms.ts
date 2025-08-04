import { BaseResource } from './base';
import { Gym, CreateGymDto, UpdateGymDto, GymStats } from '../models/gyms';
import { RequestOptions } from '../types';

export class GymsResource extends BaseResource {
  private basePath = '/api/v1/gyms';

  async createGym(
    organizationId: string,
    data: CreateGymDto, 
    options?: RequestOptions
  ): Promise<Gym> {
    return this.client.post<Gym>(
      `${this.basePath}?organizationId=${organizationId}`, 
      data, 
      { ...options, headers: { ...options?.headers } }
    );
  }

  async getOrganizationGyms(
    organizationId: string,
    options?: RequestOptions
  ): Promise<Gym[]> {
    return this.client.get<Gym[]>(
      this.basePath,
      { organizationId },
      options
    );
  }

  async getGym(id: string, options?: RequestOptions): Promise<Gym> {
    return this.client.get<Gym>(`${this.basePath}/${id}`, undefined, options);
  }

  async updateGym(
    id: string,
    data: UpdateGymDto,
    options?: RequestOptions
  ): Promise<Gym> {
    return this.client.put<Gym>(`${this.basePath}/${id}`, data, options);
  }

  async getGymStats(id: string, options?: RequestOptions): Promise<GymStats> {
    return this.client.get<GymStats>(`${this.basePath}/${id}/stats`, undefined, options);
  }

  async toggleGymStatus(id: string, options?: RequestOptions): Promise<Gym> {
    return this.client.put<Gym>(`${this.basePath}/${id}/toggle-status`, undefined, options);
  }
}