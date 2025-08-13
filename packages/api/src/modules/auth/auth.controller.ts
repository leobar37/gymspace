import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from '../../core/auth/services/auth.service';
import {
  RegisterOwnerDto,
  LoginDto,
  LoginResponseDto,
  VerifyEmailDto,
  ResendVerificationDto,
  RegisterCollaboratorDto,
  GenerateVerificationCodeDto,
  CurrentSessionDto,
} from './dto';
import { Public } from '../../common/decorators';
import { AppCtxt } from '../../common/decorators/request-context.decorator';
import { IRequestContext } from '@gymspace/shared';
import { CacheService } from '../../core/cache/cache.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cacheService: CacheService,
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
  @ApiResponse({ status: 401, description: 'User not authenticated' })
  async getCurrentSession(@AppCtxt() context: IRequestContext): Promise<CurrentSessionDto> {
    return {
      user: context.user,
      gym: context.gym,
      organization: context.organization,
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
    @AppCtxt() context: IRequestContext,
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
}
