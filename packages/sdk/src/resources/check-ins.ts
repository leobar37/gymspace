import { BaseResource } from './base';
import { 
  CheckIn, 
  CreateCheckInDto, 
  SearchCheckInsParams,
  GetCheckInStatsParams,
  CheckInStats,
  GetClientCheckInHistoryParams
} from '../models/check-ins';
import { RequestOptions, PaginatedResponseDto } from '../types';

export class CheckInsResource extends BaseResource {
  private basePath = '/api/v1/v1/check-ins';

  async createCheckIn(data: CreateCheckInDto, options?: RequestOptions): Promise<CheckIn> {
    return this.client.post<CheckIn>(this.basePath, data, options);
  }

  async searchCheckIns(
    params?: SearchCheckInsParams,
    options?: RequestOptions
  ): Promise<PaginatedResponseDto<CheckIn>> {
    return this.paginate<CheckIn>(this.basePath, params, options);
  }

  async getCheckIn(id: string, options?: RequestOptions): Promise<CheckIn> {
    return this.client.get<CheckIn>(`${this.basePath}/${id}`, undefined, options);
  }

  async deleteCheckIn(id: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(`${this.basePath}/${id}`, options);
  }

  async getGymCheckInStats(
    params: GetCheckInStatsParams,
    options?: RequestOptions
  ): Promise<CheckInStats> {
    return this.client.get<CheckInStats>(
      `${this.basePath}/stats/${params.period}`,
      undefined,
      options
    );
  }

  async getClientCheckInHistory(
    clientId: string,
    params?: GetClientCheckInHistoryParams,
    options?: RequestOptions
  ): Promise<PaginatedResponseDto<CheckIn>> {
    return this.paginate<CheckIn>(
      `${this.basePath}/client/${clientId}/history`,
      params,
      options
    );
  }
}