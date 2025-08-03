import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from '../../core/auth/services/auth.service';
import { 
  RegisterOwnerDto, 
  LoginDto, 
  LoginResponseDto,
  VerifyEmailDto,
  ResendVerificationDto,
  CompleteOnboardingDto,
  RegisterCollaboratorDto
} from './dto';
import { Public } from '../../common/decorators';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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

  @Post('verify-email')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with OTP code' })
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

  @Post('complete-onboarding')
  @Public()
  @ApiOperation({ summary: 'Complete owner onboarding with organization and gym' })
  @ApiResponse({ status: 201, description: 'Onboarding completed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data or verification required' })
  async completeOnboarding(@Body() dto: CompleteOnboardingDto) {
    return await this.authService.completeOnboarding(dto);
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
  @ApiResponse({ status: 201, description: 'Collaborator registered successfully', type: LoginResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid invitation or data' })
  async registerCollaborator(@Body() dto: RegisterCollaboratorDto): Promise<LoginResponseDto> {
    return await this.authService.registerCollaborator(dto);
  }
}
