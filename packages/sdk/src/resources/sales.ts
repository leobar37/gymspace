import { BaseResource } from './base';
import { 
  Sale,
  CreateSaleDto, 
  UpdateSaleDto,
  UpdatePaymentStatusDto,
  SearchSalesParams,
  SalesStats,
  TopSellingProduct,
  CustomerSalesReport
} from '../models/sales';
import { RequestOptions, PaginatedResponseDto } from '../types';

export class SalesResource extends BaseResource {
  private basePath = 'sales';

  async createSale(data: CreateSaleDto, options?: RequestOptions): Promise<Sale> {
    return this.client.post<Sale>(this.basePath, data, options);
  }

  async searchSales(
    params?: SearchSalesParams,
    options?: RequestOptions
  ): Promise<PaginatedResponseDto<Sale>> {
    return this.paginate<Sale>(this.basePath, params, options);
  }

  async getSale(id: string, options?: RequestOptions): Promise<Sale> {
    return this.client.get<Sale>(`${this.basePath}/${id}`, undefined, options);
  }

  async updateSale(
    id: string,
    data: UpdateSaleDto,
    options?: RequestOptions
  ): Promise<Sale> {
    return this.client.put<Sale>(`${this.basePath}/${id}`, data, options);
  }

  async updatePaymentStatus(
    id: string,
    paymentStatus: 'paid' | 'unpaid',
    options?: RequestOptions
  ): Promise<Sale> {
    return this.client.put<Sale>(`${this.basePath}/${id}/payment-status`, { paymentStatus }, options);
  }

  async deleteSale(id: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(`${this.basePath}/${id}`, options);
  }

  async getSalesStats(
    startDate?: string,
    endDate?: string,
    options?: RequestOptions
  ): Promise<SalesStats> {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    return this.client.get<SalesStats>(
      `${this.basePath}/stats`,
      Object.keys(params).length > 0 ? params : undefined,
      options
    );
  }

  async getTopSellingProducts(
    limit: number = 10,
    startDate?: string,
    endDate?: string,
    options?: RequestOptions
  ): Promise<TopSellingProduct[]> {
    const params: Record<string, string | number> = { limit };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    return this.client.get<TopSellingProduct[]>(
      `${this.basePath}/top-products`,
      params,
      options
    );
  }

  async getSalesByCustomer(
    startDate?: string,
    endDate?: string,
    options?: RequestOptions
  ): Promise<CustomerSalesReport> {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    return this.client.get<CustomerSalesReport>(
      `${this.basePath}/reports/by-customer`,
      Object.keys(params).length > 0 ? params : undefined,
      options
    );
  }
}