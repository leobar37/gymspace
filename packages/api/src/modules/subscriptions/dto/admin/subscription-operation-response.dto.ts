import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionOperationType } from './subscription-request-response.dto';

export class SubscriptionOperationResponseDto {
  @ApiProperty({
    description: 'Operation ID',
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
    description: 'Previous subscription plan name',
    example: 'Basic Plan',
    required: false,
  })
  fromPlanName?: string;

  @ApiProperty({
    description: 'New subscription plan name',
    example: 'Professional Plan',
    required: false,
  })
  toPlanName?: string;

  @ApiProperty({
    description: 'Operation type',
    enum: SubscriptionOperationType,
    example: SubscriptionOperationType.UPGRADE,
  })
  operationType: SubscriptionOperationType;

  @ApiProperty({
    description: 'User who executed the operation',
    example: 'Admin User',
  })
  executedByName: string;

  @ApiProperty({
    description: 'Operation effective date',
    example: '2023-12-01T00:00:00Z',
  })
  effectiveDate: Date;

  @ApiProperty({
    description: 'Previous subscription end date',
    example: '2023-11-30T23:59:59Z',
    required: false,
  })
  previousEndDate?: Date;

  @ApiProperty({
    description: 'New subscription end date',
    example: '2024-12-01T23:59:59Z',
    required: false,
  })
  newEndDate?: Date;

  @ApiProperty({
    description: 'Proration amount',
    example: 15.50,
    required: false,
  })
  prorationAmount?: number;

  @ApiProperty({
    description: 'Operation notes',
    example: 'Upgraded due to increased usage',
    required: false,
  })
  notes?: string;

  @ApiProperty({
    description: 'Operation creation date',
    example: '2023-12-01T10:00:00Z',
  })
  createdAt: Date;
}