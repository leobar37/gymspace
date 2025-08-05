import { BaseResource } from './base';
import { 
  Contract, 
  CreateContractDto, 
  RenewContractDto, 
  FreezeContractDto,
  GetContractsParams 
} from '../models/contracts';
import { RequestOptions, PaginatedResponseDto } from '../types';

export class ContractsResource extends BaseResource {
  private basePath = 'contracts';

  async createContract(data: CreateContractDto, options?: RequestOptions): Promise<Contract> {
    return this.client.post<Contract>(this.basePath, data, options);
  }

  async getGymContracts(
    params?: GetContractsParams,
    options?: RequestOptions
  ): Promise<PaginatedResponseDto<Contract>> {
    return this.paginate<Contract>(this.basePath, params, options);
  }

  async getContract(id: string, options?: RequestOptions): Promise<Contract> {
    return this.client.get<Contract>(`${this.basePath}/${id}`, undefined, options);
  }

  async getClientContracts(
    clientId: string,
    options?: RequestOptions
  ): Promise<Contract[]> {
    return this.client.get<Contract[]>(
      `${this.basePath}/client/${clientId}`, 
      undefined, 
      options
    );
  }

  async renewContract(
    id: string,
    data: RenewContractDto,
    options?: RequestOptions
  ): Promise<Contract> {
    return this.client.post<Contract>(`${this.basePath}/${id}/renew`, data, options);
  }

  async freezeContract(
    id: string,
    data: FreezeContractDto,
    options?: RequestOptions
  ): Promise<Contract> {
    return this.client.post<Contract>(`${this.basePath}/${id}/freeze`, data, options);
  }

  async cancelContract(id: string, data: { reason: string }, options?: RequestOptions): Promise<Contract> {
    return this.client.put<Contract>(`${this.basePath}/${id}/cancel`, data, options);
  }
}