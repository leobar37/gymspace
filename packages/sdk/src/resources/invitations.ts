import { BaseResource } from './base';
import { 
  Invitation, 
  CreateInvitationDto, 
  AcceptInvitationDto,
  GetGymInvitationsParams 
} from '../models/invitations';
import { RequestOptions } from '../types';

export class InvitationsResource extends BaseResource {
  private basePath = '/api/v1/invitations';

  async createInvitation(
    data: CreateInvitationDto, 
    options?: RequestOptions
  ): Promise<Invitation> {
    return this.client.post<Invitation>(this.basePath, data, options);
  }

  async getGymInvitations(
    params: GetGymInvitationsParams,
    options?: RequestOptions
  ): Promise<Invitation[]> {
    return this.client.get<Invitation[]>(this.basePath, params, options);
  }

  async acceptInvitation(
    token: string,
    data: AcceptInvitationDto,
    options?: RequestOptions
  ): Promise<void> {
    return this.client.post<void>(`${this.basePath}/${token}/accept`, data, options);
  }

  async cancelInvitation(id: string, options?: RequestOptions): Promise<void> {
    return this.client.put<void>(`${this.basePath}/${id}/cancel`, undefined, options);
  }
}