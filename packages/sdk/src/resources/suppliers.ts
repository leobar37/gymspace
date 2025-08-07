import { BaseResource } from './base';
import { 
  Supplier,
  CreateSupplierDto, 
  UpdateSupplierDto,
  SearchSuppliersParams,
  SuppliersStats
} from '../models/suppliers';
import { RequestOptions, PaginatedResponseDto } from '../types';

export class SuppliersResource extends BaseResource {
  private basePath = 'suppliers';

  async createSupplier(data: CreateSupplierDto, options?: RequestOptions): Promise<Supplier> {
    return this.client.post<Supplier>(this.basePath, data, options);
  }

  async searchSuppliers(
    params?: SearchSuppliersParams,
    options?: RequestOptions
  ): Promise<PaginatedResponseDto<Supplier>> {
    return this.paginate<Supplier>(this.basePath, params, options);
  }

  async getSupplier(id: string, options?: RequestOptions): Promise<Supplier> {
    return this.client.get<Supplier>(`${this.basePath}/${id}`, undefined, options);
  }

  async updateSupplier(
    id: string,
    data: UpdateSupplierDto,
    options?: RequestOptions
  ): Promise<Supplier> {
    return this.client.put<Supplier>(`${this.basePath}/${id}`, data, options);
  }

  async deleteSupplier(id: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(`${this.basePath}/${id}`, options);
  }

  async getSuppliersStats(options?: RequestOptions): Promise<SuppliersStats> {
    return this.client.get<SuppliersStats>(`${this.basePath}/stats`, undefined, options);
  }
}