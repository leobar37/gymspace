import { BaseResource } from './base';
import { 
  PaymentMethod,
  CreatePaymentMethodDto, 
  UpdatePaymentMethodDto,
  SearchPaymentMethodsParams,
  PaymentMethodStats
} from '../models/payment-methods';
import { RequestOptions, PaginatedResponseDto } from '../types';

export class PaymentMethodsResource extends BaseResource {
  private basePath = 'payment-methods';

  async createPaymentMethod(data: CreatePaymentMethodDto, options?: RequestOptions): Promise<PaymentMethod> {
    return this.client.post<PaymentMethod>(this.basePath, data, options);
  }

  async searchPaymentMethods(
    params?: SearchPaymentMethodsParams,
    options?: RequestOptions
  ): Promise<PaginatedResponseDto<PaymentMethod>> {
    return this.paginate<PaymentMethod>(this.basePath, params, options);
  }

  async getPaymentMethod(id: string, options?: RequestOptions): Promise<PaymentMethod> {
    return this.client.get<PaymentMethod>(`${this.basePath}/${id}`, undefined, options);
  }

  async updatePaymentMethod(
    id: string,
    data: UpdatePaymentMethodDto,
    options?: RequestOptions
  ): Promise<PaymentMethod> {
    return this.client.put<PaymentMethod>(`${this.basePath}/${id}`, data, options);
  }

  async deletePaymentMethod(id: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(`${this.basePath}/${id}`, options);
  }

  async togglePaymentMethod(id: string, options?: RequestOptions): Promise<PaymentMethod> {
    return this.client.put<PaymentMethod>(`${this.basePath}/${id}/toggle`, undefined, options);
  }

  async getPaymentMethodStats(options?: RequestOptions): Promise<PaymentMethodStats> {
    return this.client.get<PaymentMethodStats>(`${this.basePath}/stats`, undefined, options);
  }
}