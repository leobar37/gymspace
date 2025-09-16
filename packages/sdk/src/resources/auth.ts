import {
  CurrentSessionResponse,
  InvitationValidationResponse,
  LoginDto,
  LoginResponseDto,
  RegisterCollaboratorDto,
  RegisterOwnerDto,
  ResendVerificationDto,
  VerifyEmailDto,
  ChangePasswordDto,
  ChangePasswordResponseDto,
  RequestPasswordResetDto,
  RequestPasswordResetResponseDto,
  VerifyResetCodeDto,
  VerifyResetCodeResponseDto,
  ResetPasswordDto,
  ResetPasswordResponseDto,
  ResendResetCodeDto,
  ResendResetCodeResponseDto,
} from '../models/auth';
import { SubscriptionPlan } from '../models/subscriptions';
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

  async refreshToken(refreshToken: string, options?: RequestOptions): Promise<LoginResponseDto> {
    return this.client.post<LoginResponseDto>(`${this.basePath}/refresh`, { refresh_token: refreshToken }, options);
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

  async changePassword(
    data: ChangePasswordDto,
    options?: RequestOptions,
  ): Promise<ChangePasswordResponseDto> {
    return this.client.post<ChangePasswordResponseDto>(
      `${this.basePath}/change-password`,
      data,
      options,
    );
  }

  async requestPasswordReset(
    data: RequestPasswordResetDto,
    options?: RequestOptions,
  ): Promise<RequestPasswordResetResponseDto> {
    return this.client.post<RequestPasswordResetResponseDto>(
      `${this.basePath}/password-reset/request`,
      data,
      options,
    );
  }

  async verifyResetCode(
    data: VerifyResetCodeDto,
    options?: RequestOptions,
  ): Promise<VerifyResetCodeResponseDto> {
    return this.client.post<VerifyResetCodeResponseDto>(
      `${this.basePath}/password-reset/verify-code`,
      data,
      options,
    );
  }

  async resetPassword(
    data: ResetPasswordDto,
    options?: RequestOptions,
  ): Promise<ResetPasswordResponseDto> {
    return this.client.post<ResetPasswordResponseDto>(
      `${this.basePath}/password-reset/reset`,
      data,
      options,
    );
  }

  async resendResetCode(
    data: ResendResetCodeDto,
    options?: RequestOptions,
  ): Promise<ResendResetCodeResponseDto> {
    return this.client.post<ResendResetCodeResponseDto>(
      `${this.basePath}/password-reset/resend-code`,
      data,
      options,
    );
  }
}
