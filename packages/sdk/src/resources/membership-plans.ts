import { BaseResource } from './base';
import { 
  MembershipPlan, 
  CreateMembershipPlanDto, 
  UpdateMembershipPlanDto, 
  MembershipPlanStats,
  GetMembershipPlansParams 
} from '../models/membership-plans';
import { RequestOptions } from '../types';

export class MembershipPlansResource extends BaseResource {
  private basePath = '/api/v1/membership-plans';

  async createMembershipPlan(
    data: CreateMembershipPlanDto, 
    options?: RequestOptions
  ): Promise<MembershipPlan> {
    return this.client.post<MembershipPlan>(this.basePath, data, options);
  }

  async getGymMembershipPlans(
    params?: GetMembershipPlansParams,
    options?: RequestOptions
  ): Promise<MembershipPlan[]> {
    return this.client.get<MembershipPlan[]>(this.basePath, params, options);
  }

  async getMembershipPlan(id: string, options?: RequestOptions): Promise<MembershipPlan> {
    return this.client.get<MembershipPlan>(`${this.basePath}/${id}`, undefined, options);
  }

  async updateMembershipPlan(
    id: string,
    data: UpdateMembershipPlanDto,
    options?: RequestOptions
  ): Promise<MembershipPlan> {
    return this.client.put<MembershipPlan>(`${this.basePath}/${id}`, data, options);
  }

  async deleteMembershipPlan(id: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(`${this.basePath}/${id}`, options);
  }

  async getMembershipPlanStats(
    id: string, 
    options?: RequestOptions
  ): Promise<MembershipPlanStats> {
    return this.client.get<MembershipPlanStats>(
      `${this.basePath}/${id}/stats`, 
      undefined, 
      options
    );
  }
}