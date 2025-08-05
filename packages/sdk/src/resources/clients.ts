import { BaseResource } from './base';
import { 
  Client, 
  CreateClientDto, 
  UpdateClientDto, 
  ClientStats,
  SearchClientsParams 
} from '../models/clients';
import { RequestOptions, PaginatedResponseDto } from '../types';

export class ClientsResource extends BaseResource {
  private basePath = 'clients';

  async createClient(data: CreateClientDto, options?: RequestOptions): Promise<Client> {
    return this.client.post<Client>(this.basePath, data, options);
  }

  async searchClients(
    params?: SearchClientsParams,
    options?: RequestOptions
  ): Promise<PaginatedResponseDto<Client>> {
    return this.paginate<Client>(this.basePath, params, options);
  }

  async getClient(id: string, options?: RequestOptions): Promise<Client> {
    return this.client.get<Client>(`${this.basePath}/${id}`, undefined, options);
  }

  async updateClient(
    id: string,
    data: UpdateClientDto,
    options?: RequestOptions
  ): Promise<Client> {
    return this.client.put<Client>(`${this.basePath}/${id}`, data, options);
  }

  async toggleClientStatus(id: string, options?: RequestOptions): Promise<Client> {
    return this.client.put<Client>(`${this.basePath}/${id}/toggle-status`, undefined, options);
  }

  async getClientStats(id: string, options?: RequestOptions): Promise<ClientStats> {
    return this.client.get<ClientStats>(`${this.basePath}/${id}/stats`, undefined, options);
  }
}