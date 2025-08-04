import { BaseResource } from './base';
import { 
  Lead, 
  CreateLeadDto, 
  UpdateLeadDto,
  SearchLeadsParams,
  LeadStats 
} from '../models/leads';
import { RequestOptions, PaginatedResponseDto } from '../types';

export class LeadsResource extends BaseResource {
  private basePath = '/api/v1/leads';

  async createLead(data: CreateLeadDto, options?: RequestOptions): Promise<Lead> {
    return this.client.post<Lead>(this.basePath, data, options);
  }

  async searchLeads(
    params?: SearchLeadsParams,
    options?: RequestOptions
  ): Promise<PaginatedResponseDto<Lead>> {
    return this.paginate<Lead>(this.basePath, params, options);
  }

  async getLead(id: string, options?: RequestOptions): Promise<Lead> {
    return this.client.get<Lead>(`${this.basePath}/${id}`, undefined, options);
  }

  async updateLead(
    id: string,
    data: UpdateLeadDto,
    options?: RequestOptions
  ): Promise<Lead> {
    return this.client.put<Lead>(`${this.basePath}/${id}`, data, options);
  }

  async getLeadStats(options?: RequestOptions): Promise<LeadStats> {
    return this.client.get<LeadStats>(`${this.basePath}/stats/gym`, undefined, options);
  }

  async convertLead(id: string, options?: RequestOptions): Promise<{ clientId: string }> {
    return this.client.post<{ clientId: string }>(
      `${this.basePath}/${id}/convert`,
      undefined,
      options
    );
  }
}