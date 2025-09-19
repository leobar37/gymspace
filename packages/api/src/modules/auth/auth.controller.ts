import { IRequestContext } from '@gymspace/shared';
import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Allow, Public } from '../../common/decorators';
import { AppCtxt } from '../../common/decorators/request-context.decorator';
import { AuthService } from '../../core/auth/services/auth.service';
import { ResetPasswordMeService } from '../../core/auth/services/reset-password-me.service';
import { CacheService } from '../../core/cache/cache.service';
import {
  ChangePasswordDto,
  ChangePasswordResponseDto,
  CurrentSessionDto,
  GenerateVerificationCodeDto,
  LoginDto,
  LoginResponseDto,
  RegisterCollaboratorDto,
  RegisterOwnerDto,
  RequestPasswordResetDto,
  RequestPasswordResetResponseDto,
  ResendResetCodeDto,
  ResendResetCodeResponseDto,
  ResendVerificationDto,
  ResetPasswordDto,
  ResetPasswordResponseDto,
  VerifyEmailDto,
  VerifyResetCodeDto,
  VerifyResetCodeResponseDto,
} from './dto';
import { RequestContext } from '~/common/services/request-context.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cacheService: CacheService,
    private readonly resetPasswordMeService: ResetPasswordMeService,
  ) {}

  @Post('register/owner')
  @Public()
  @ApiOperation({ summary: 'Register a new gym owner' })
  @ApiResponse({ status: 201, description: 'Owner registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async registerOwner(@Body() dto: RegisterOwnerDto) {
    return await this.authService.registerOwner(dto);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return await this.authService.login(dto);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Body('refresh_token') refreshToken: string) {
    return await this.authService.refreshToken(refreshToken);
  }

  @Post('generate-verification-code')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate and send verification code to email' })
  @ApiResponse({ status: 200, description: 'Verification code sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or email already verified' })
  async generateVerificationCode(@Body() dto: GenerateVerificationCodeDto) {
    return await this.authService.generateAndSendVerificationCode(dto.email, dto.name);
  }

  @Post('verify-email')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with verification code' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired code' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return await this.authService.verifyEmail(dto);
  }

  @Post('resend-verification')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend email verification code' })
  @ApiResponse({ status: 200, description: 'Verification code sent' })
  @ApiResponse({ status: 400, description: 'Email already verified or invalid' })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return await this.authService.resendVerification(dto);
  }

  @Get('subscription-plans')
  @Public()
  @ApiOperation({ summary: 'Get available subscription plans' })
  @ApiResponse({ status: 200, description: 'List of subscription plans' })
  async getSubscriptionPlans() {
    return await this.authService.getSubscriptionPlans();
  }

  @Get('invitation/:token')
  @Public()
  @ApiOperation({ summary: 'Validate invitation token' })
  @ApiResponse({ status: 200, description: 'Invitation details' })
  @ApiResponse({ status: 404, description: 'Invalid or expired invitation' })
  async validateInvitation(@Param('token') token: string) {
    return await this.authService.validateInvitation(token);
  }

  @Post('register/collaborator')
  @Public()
  @ApiOperation({ summary: 'Complete collaborator registration with invitation' })
  @ApiResponse({
    status: 201,
    description: 'Collaborator registered successfully',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid invitation or data' })
  async registerCollaborator(@Body() dto: RegisterCollaboratorDto): Promise<LoginResponseDto> {
    return await this.authService.registerCollaborator(dto);
  }

  @Get('current-session')
  @ApiOperation({ summary: 'Get current user session information' })
  @ApiResponse({
    status: 200,
    description: 'Current session information',
    type: CurrentSessionDto,
  })
  @Allow()
  @ApiResponse({ status: 401, description: 'User not authenticated' })
  async getCurrentSession(
    @AppCtxt() context: IRequestContext,
    @Headers('authorization') authorization: string,
    @Headers('x-refresh-token') refreshToken: string,
  ): Promise<CurrentSessionDto> {
    console.log('server context', context);

    // Extract token from Authorization header
    const accessToken = authorization ? authorization.replace('Bearer ', '') : '';

    // Check if token needs refresh and refresh if necessary
    let finalAccessToken = accessToken;
    let newRefreshToken: string | undefined;

    if (accessToken && refreshToken) {
      const refreshResult = await this.authService.checkAndRefreshToken(
        accessToken,
        refreshToken,
      );

      if (refreshResult.refreshed) {
        finalAccessToken = refreshResult.accessToken;
        newRefreshToken = refreshResult.refreshToken;
      }
    }

    return {
      accessToken: finalAccessToken,
      refreshToken: newRefreshToken, // Will be undefined if not refreshed
      user: context.user,
      gym: context.gym,
      organization: context.organization,
      subscription: context.subscription,
      permissions: context.permissions,
      isAuthenticated: true,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout current user and invalidate token' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'User not authenticated' })
  async logout(
    @Headers('authorization') authorization: string,
    @AppCtxt() context: RequestContext,
  ) {
    if (authorization) {
      const token = authorization.replace('Bearer ', '');

      // Blacklist the token to prevent further use
      // Token will be blacklisted for 24 hours (86400 seconds)
      await this.cacheService.blacklistToken(token, 86400000); // 24 hours in milliseconds

      // Invalidate user's cached auth data
      if (context.user?.id) {
        await this.cacheService.invalidateUserAuthCache(context.user.id);
      }
    }

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password for authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    type: ChangePasswordResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid current password or validation error' })
  @ApiResponse({ status: 401, description: 'User not authenticated' })
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @AppCtxt() context: IRequestContext,
  ): Promise<ChangePasswordResponseDto> {
    return await this.resetPasswordMeService.changePasswordWithValidation(
      context,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Post('password-reset/request')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset code' })
  @ApiResponse({
    status: 200,
    description: 'Password reset code sent if email exists',
    type: RequestPasswordResetResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async requestPasswordReset(
    @Body() dto: RequestPasswordResetDto,
  ): Promise<RequestPasswordResetResponseDto> {
    return await this.resetPasswordMeService.requestPasswordReset(dto.email);
  }

  @Post('password-reset/verify-code')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify password reset code and get reset token' })
  @ApiResponse({
    status: 200,
    description: 'Code verified successfully',
    type: VerifyResetCodeResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired code' })
  async verifyResetCode(@Body() dto: VerifyResetCodeDto): Promise<VerifyResetCodeResponseDto> {
    return await this.resetPasswordMeService.verifyResetCode(dto.email, dto.code);
  }

  @Post('password-reset/reset')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
    type: ResetPasswordResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid token or password' })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<ResetPasswordResponseDto> {
    return await this.resetPasswordMeService.resetPasswordWithToken(
      dto.resetToken,
      dto.newPassword,
    );
  }

  @Post('password-reset/resend-code')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend password reset code' })
  @ApiResponse({
    status: 200,
    description: 'Reset code resent if email exists',
    type: ResendResetCodeResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Too many requests or invalid email' })
  async resendResetCode(@Body() dto: ResendResetCodeDto): Promise<ResendResetCodeResponseDto> {
    return await this.resetPasswordMeService.resendResetCode(dto.email);
  }
}
