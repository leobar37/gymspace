import { BaseResource } from './base';
import { Organization, UpdateOrganizationDto, OrganizationStats, OrganizationWithDetails } from '../models/organizations';
import { RequestOptions } from '../types';

export class OrganizationsResource extends BaseResource {
  private basePath = 'organizations';

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

  async listOrganizations(options?: RequestOptions): Promise<OrganizationWithDetails[]> {
    return this.client.get<OrganizationWithDetails[]>(`${this.basePath}/list`, undefined, options);
  }
}