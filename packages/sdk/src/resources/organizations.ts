import { BaseResource } from './base';
import { Organization, UpdateOrganizationDto, OrganizationStats } from '../models/organizations';
import { RequestOptions } from '../types';

export class OrganizationsResource extends BaseResource {
  private basePath = '/api/v1/v1/organizations';

  async getOrganization(id: string, options?: RequestOptions): Promise<Organization> {
    return this.client.get<Organization>(`${this.basePath}/${id}`, undefined, options);
  }

  async updateOrganization(
    id: string, 
    data: UpdateOrganizationDto, 
    options?: RequestOptions
  ): Promise<Organization> {
    return this.client.put<Organization>(`${this.basePath}/${id}`, data, options);
  }

  async getOrganizationStats(id: string, options?: RequestOptions): Promise<OrganizationStats> {
    return this.client.get<OrganizationStats>(`${this.basePath}/${id}/stats`, undefined, options);
  }
}