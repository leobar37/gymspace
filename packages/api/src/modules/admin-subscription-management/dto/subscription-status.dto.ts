import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionStatus } from '@gymspace/shared';

export class SubscriptionStatusDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  organizationId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  subscriptionPlanId: string;

  @ApiProperty({ example: 'Premium' })
  planName: string;

  @ApiProperty({ enum: SubscriptionStatus, example: SubscriptionStatus.ACTIVE })
  status: SubscriptionStatus;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  startDate: Date;

  @ApiProperty({ example: '2024-12-31T23:59:59Z' })
  endDate: Date;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: false })
  isExpired: boolean;

  @ApiProperty({ example: 30 })
  daysRemaining: number;

  @ApiProperty({
    example: { cancellationReason: 'Customer requested' },
    description: 'Additional metadata',
    required: false,
  })
  metadata?: Record<string, any>;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  updatedAt: Date;
}