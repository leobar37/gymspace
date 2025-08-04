import { Controller, Post, Put, Get, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { OnboardingService } from './onboarding.service';
import { 
  StartOnboardingDto, 
  UpdateGymSettingsDto, 
  ConfigureFeaturesDto, 
  CompleteGuidedSetupDto,
  OnboardingStatusDto
} from './dto';
import { Public, Allow, RequestContext } from '../../common/decorators';
import { IRequestContext } from '@gymspace/shared';
import { ResourceNotFoundException } from '../../common/exceptions';
import { PrismaService } from '../../core/database/prisma.service';

@ApiTags('Onboarding')
@Controller('onboarding')
export class OnboardingController {
  constructor(
    private readonly onboardingService: OnboardingService,
    private readonly prismaService: PrismaService
  ) {}

  @Post('start')
  @Public()
  @ApiOperation({ 
    summary: 'Start gym onboarding process',
    description: 'Creates owner account, organization, and initial gym. This is the first step in the onboarding process.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Onboarding started successfully',
    schema: {
      example: {
        success: true,
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'john@example.com',
          name: 'John Doe',
          userType: 'owner'
        },
        organization: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'My Fitness Center'
        },
        gym: {
          id: '123e4567-e89b-12d3-a456-426614174002',
          name: 'My Fitness Center - Main Location'
        },
        onboardingStatus: {
          currentStep: 'account_created',
          completionPercentage: 25
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async startOnboarding(@Body() dto: StartOnboardingDto) {
    return await this.onboardingService.startOnboarding(dto);
  }

  @Put('gym-settings')
  @Allow('GYMS_UPDATE')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Update gym settings',
    description: 'Configure gym details including business hours, amenities, and branding. This is step 2 of onboarding.'
  })
  @ApiResponse({ status: 200, description: 'Gym settings updated successfully' })
  @ApiResponse({ status: 404, description: 'Gym not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async updateGymSettings(
    @RequestContext() context: IRequestContext,
    @Body() dto: UpdateGymSettingsDto
  ) {
    return await this.onboardingService.updateGymSettings(context, dto);
  }

  @Put('configure-features')
  @Allow('GYMS_UPDATE')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Configure gym features',
    description: 'Enable/disable and configure various gym management features. This is step 3 of onboarding.'
  })
  @ApiResponse({ status: 200, description: 'Features configured successfully' })
  @ApiResponse({ status: 404, description: 'Gym not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async configureFeatures(
    @RequestContext() context: IRequestContext,
    @Body() dto: ConfigureFeaturesDto
  ) {
    return await this.onboardingService.configureFeatures(context, dto);
  }

  @Post('complete')
  @Allow('GYMS_UPDATE')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Complete guided setup',
    description: 'Mark the onboarding process as complete. All previous steps must be completed first.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Onboarding completed successfully',
    schema: {
      example: {
        success: true,
        message: 'Congratulations! Your gym setup is complete.',
        onboardingStatus: {
          currentStep: 'completed',
          isCompleted: true,
          completionPercentage: 100
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Previous steps not completed' })
  @ApiResponse({ status: 404, description: 'Gym not found' })
  async completeGuidedSetup(
    @RequestContext() context: IRequestContext,
    @Body() dto: CompleteGuidedSetupDto
  ) {
    return await this.onboardingService.completeGuidedSetup(context, dto);
  }

  @Get('status/:gymId')
  @Allow('GYMS_READ')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get onboarding status',
    description: 'Check the current onboarding progress and next steps'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Onboarding status',
    type: OnboardingStatusDto
  })
  @ApiResponse({ status: 404, description: 'Gym not found' })
  async getOnboardingStatus(
    @Param('gymId') gymId: string
  ) {
    // Get organization ID from gym
    const gym = await this.prismaService.gym.findUnique({
      where: { id: gymId },
      select: { organizationId: true }
    });

    if (!gym) {
      throw new ResourceNotFoundException('Gym not found');
    }

    return await this.onboardingService.getOnboardingStatus(gym.organizationId, gymId);
  }
}