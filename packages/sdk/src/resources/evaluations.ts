import { BaseResource } from './base';
import { 
  Evaluation, 
  CreateEvaluationDto, 
  UpdateEvaluationDto,
  GetClientEvaluationsParams,
  EvaluationReport
} from '../models/evaluations';
import { RequestOptions, PaginatedResponseDto } from '../types';

export class EvaluationsResource extends BaseResource {
  private basePath = '/api/v1/evaluations';

  async createEvaluation(
    data: CreateEvaluationDto, 
    options?: RequestOptions
  ): Promise<Evaluation> {
    return this.client.post<Evaluation>(this.basePath, data, options);
  }

  async getEvaluation(id: string, options?: RequestOptions): Promise<Evaluation> {
    return this.client.get<Evaluation>(`${this.basePath}/${id}`, undefined, options);
  }

  async updateEvaluation(
    id: string,
    data: UpdateEvaluationDto,
    options?: RequestOptions
  ): Promise<Evaluation> {
    return this.client.put<Evaluation>(`${this.basePath}/${id}`, data, options);
  }

  async deleteEvaluation(id: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(`${this.basePath}/${id}`, options);
  }

  async getClientEvaluations(
    clientId: string,
    params?: GetClientEvaluationsParams,
    options?: RequestOptions
  ): Promise<PaginatedResponseDto<Evaluation>> {
    return this.paginate<Evaluation>(
      `${this.basePath}/client/${clientId}`,
      params,
      options
    );
  }

  async getGymEvaluationStats(options?: RequestOptions): Promise<any> {
    return this.client.get(`${this.basePath}/gym/stats`, undefined, options);
  }

  async generateEvaluationReport(
    id: string,
    options?: RequestOptions
  ): Promise<EvaluationReport> {
    return this.client.get<EvaluationReport>(
      `${this.basePath}/${id}/report`,
      undefined,
      options
    );
  }
}