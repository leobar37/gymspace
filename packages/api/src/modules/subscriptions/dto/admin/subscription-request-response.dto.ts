import { ApiProperty } from '@nestjs/swagger';

export enum SubscriptionRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum SubscriptionOperationType {
  UPGRADE = 'upgrade',
  DOWNGRADE = 'downgrade',
  RENEWAL = 'renewal',
  CANCELLATION = 'cancellation',
  ACTIVATION = 'activation',
}

export class SubscriptionRequestResponseDto {
  @ApiProperty({
    description: 'Request ID',
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
    description: 'Subscription plan ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  subscriptionPlanId: string;

  @ApiProperty({
    description: 'Subscription plan name',
    example: 'Professional Plan',
  })
  subscriptionPlanName: string;

  @ApiProperty({
    description: 'User who requested the change',
    example: 'John Doe',
  })
  requestedByName: string;

  @ApiProperty({
    description: 'Request status',
    enum: SubscriptionRequestStatus,
    example: SubscriptionRequestStatus.PENDING,
  })
  status: SubscriptionRequestStatus;

  @ApiProperty({
    description: 'Operation type',
    enum: SubscriptionOperationType,
    example: SubscriptionOperationType.UPGRADE,
  })
  operationType: SubscriptionOperationType;

  @ApiProperty({
    description: 'Requested start date',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  requestedStartDate?: Date;

  @ApiProperty({
    description: 'User notes',
    example: 'Need more capacity for the new gym location',
    required: false,
  })
  notes?: string;

  @ApiProperty({
    description: 'Admin notes',
    example: 'Approved after verification',
    required: false,
  })
  adminNotes?: string;

  @ApiProperty({
    description: 'User who processed the request',
    example: 'Admin User',
    required: false,
  })
  processedByName?: string;

  @ApiProperty({
    description: 'When the request was processed',
    example: '2023-12-01T15:30:00Z',
    required: false,
  })
  processedAt?: Date;

  @ApiProperty({
    description: 'Request creation date',
    example: '2023-12-01T10:00:00Z',
  })
  createdAt: Date;
}