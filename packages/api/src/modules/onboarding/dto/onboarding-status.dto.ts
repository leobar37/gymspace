import { ApiProperty } from '@nestjs/swagger';

export enum OnboardingStep {
  ACCOUNT_CREATED = 'account_created',
  GYM_SETTINGS = 'gym_settings',
  FEATURES_CONFIGURED = 'features_configured',
  COMPLETED = 'completed',
}

export class OnboardingStatusDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Organization ID' })
  organizationId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Gym ID' })
  gymId: string;

  @ApiProperty({
    enum: OnboardingStep,
    example: OnboardingStep.GYM_SETTINGS,
    description: 'Current onboarding step',
  })
  currentStep: OnboardingStep;

  @ApiProperty({ example: true, description: 'Whether account creation is completed' })
  accountCreated: boolean;

  @ApiProperty({ example: false, description: 'Whether gym settings are completed' })
  gymSettingsCompleted: boolean;

  @ApiProperty({ example: false, description: 'Whether features are configured' })
  featuresConfigured: boolean;

  @ApiProperty({ example: false, description: 'Whether entire onboarding is completed' })
  isCompleted: boolean;

  @ApiProperty({ example: 'Configure your gym settings', description: 'Next action to take' })
  nextAction: string;

  @ApiProperty({ example: 50, description: 'Completion percentage' })
  completionPercentage: number;
}
