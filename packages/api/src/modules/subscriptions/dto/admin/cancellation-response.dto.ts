import { ApiProperty } from '@nestjs/swagger';

export enum CancellationReason {
  COST_TOO_HIGH = 'cost_too_high',
  FEATURE_LIMITATIONS = 'feature_limitations',
  SWITCHING_PROVIDERS = 'switching_providers',
  BUSINESS_CLOSURE = 'business_closure',
  TECHNICAL_ISSUES = 'technical_issues',
  POOR_SUPPORT = 'poor_support',
  OTHER = 'other',
}

export class CancellationResponseDto {
  @ApiProperty({
    description: 'Cancellation ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Organization ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  organizationId: string;

  @ApiProperty({
    description: 'Organization name',
    example: 'Fitness Corp',
  })
  organizationName: string;

  @ApiProperty({
    description: 'Subscription plan name',
    example: 'Professional Plan',
  })
  subscriptionPlanName: string;

  @ApiProperty({
    description: 'User who requested the cancellation',
    example: 'John Doe',
  })
  requestedByName: string;

  @ApiProperty({
    description: 'Cancellation reason',
    enum: CancellationReason,
    example: CancellationReason.COST_TOO_HIGH,
  })
  reason: CancellationReason;

  @ApiProperty({
    description: 'Detailed reason description',
    example: 'The monthly cost is too high for our current budget',
    required: false,
  })
  reasonDescription?: string;

  @ApiProperty({
    description: 'Cancellation effective date',
    example: '2024-01-01T00:00:00Z',
  })
  effectiveDate: Date;

  @ApiProperty({
    description: 'Refund amount',
    example: 50.00,
    required: false,
  })
  refundAmount?: number;

  @ApiProperty({
    description: 'Whether retention offer was made',
    example: true,
  })
  retentionOffered: boolean;

  @ApiProperty({
    description: 'Retention offer details',
    example: 'Offered 50% discount for 3 months',
    required: false,
  })
  retentionDetails?: string;

  @ApiProperty({
    description: 'User who processed the cancellation',
    example: 'Admin User',
    required: false,
  })
  processedByName?: string;

  @ApiProperty({
    description: 'When the cancellation was processed',
    example: '2023-12-01T15:30:00Z',
    required: false,
  })
  processedAt?: Date;

  @ApiProperty({
    description: 'Cancellation request creation date',
    example: '2023-12-01T10:00:00Z',
  })
  createdAt: Date;
}