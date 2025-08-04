import {
  CurrentSessionResponse,
  InvitationValidationResponse,
  LoginDto,
  LoginResponseDto,
  RegisterCollaboratorDto,
  RegisterOwnerDto,
  ResendVerificationDto,
  SubscriptionPlan,
  VerifyEmailDto,
} from '../models/auth';
import { RequestOptions } from '../types';
import { BaseResource } from './base';

export class AuthResource extends BaseResource {
  private basePath = 'auth';

  async registerOwner(data: RegisterOwnerDto, options?: RequestOptions): Promise<void> {
    return this.client.post(`${this.basePath}/register/owner`, data, options);
  }

  async login(data: LoginDto, options?: RequestOptions): Promise<LoginResponseDto> {
    return this.client.post<LoginResponseDto>(`${this.basePath}/login`, data, options);
  }

  async refreshToken(options?: RequestOptions): Promise<LoginResponseDto> {
    return this.client.post<LoginResponseDto>(`${this.basePath}/refresh`, undefined, options);
  }

  async verifyEmail(
    data: VerifyEmailDto,
    options?: RequestOptions,
  ): Promise<{ success: boolean; message: string }> {
    return this.client.post(`${this.basePath}/verify-email`, data, options);
  }

  async resendVerification(
    data: ResendVerificationDto,
    options?: RequestOptions,
  ): Promise<{ success: boolean; message: string }> {
    console.log('the path', `${this.basePath}/resend-verification`);

    return this.client.post(`${this.basePath}/resend-verification`, data, options);
  }


  async getSubscriptionPlans(options?: RequestOptions): Promise<{ data: SubscriptionPlan[] }> {
    return this.client.get(`${this.basePath}/subscription-plans`, options);
  }

  async validateInvitation(
    token: string,
    options?: RequestOptions,
  ): Promise<InvitationValidationResponse> {
    return this.client.get(`${this.basePath}/invitation/${token}`, options);
  }

  async registerCollaborator(
    data: RegisterCollaboratorDto,
    options?: RequestOptions,
  ): Promise<LoginResponseDto> {
    return this.client.post<LoginResponseDto>(
      `${this.basePath}/register/collaborator`,
      data,
      options,
    );
  }

  async getCurrentSession(options?: RequestOptions): Promise<CurrentSessionResponse> {
    return this.client.get<CurrentSessionResponse>(`${this.basePath}/current-session`, options);
  }
}
