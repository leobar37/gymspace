import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, IsString } from 'class-validator';

export class SubscriptionHistoryQueryDto {
  @ApiProperty({
    required: false,
    description: 'Filter by operation type',
    enum: ['upgrade', 'downgrade', 'renewal', 'cancellation', 'activation'],
  })
  @IsOptional()
  @IsString()
  operationType?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by organization name',
  })
  @IsOptional()
  @IsString()
  organizationName?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by plan name',
  })
  @IsOptional()
  @IsString()
  planName?: string;

  @ApiProperty({
    required: false,
    description: 'Page number (default: 1)',
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    required: false,
    description: 'Items per page (default: 20, max: 100)',
    minimum: 1,
    default: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

export class SubscriptionHistoryItemDto {
  @ApiProperty({ description: 'Operation ID' })
  id: string;

  @ApiProperty({ description: 'Organization ID' })
  organizationId: string;

  @ApiProperty({ description: 'Organization name' })
  organizationName: string;

  @ApiProperty({ description: 'Previous plan name (for upgrades/downgrades)' })
  fromPlanName?: string;

  @ApiProperty({ description: 'New plan name' })
  toPlanName: string;

  @ApiProperty({ 
    description: 'Type of operation',
    enum: ['upgrade', 'downgrade', 'renewal', 'cancellation', 'activation']
  })
  operationType: string;

  @ApiProperty({ description: 'User who executed the operation' })
  executedByName: string;

  @ApiProperty({ description: 'When the operation took effect' })
  effectiveDate: string;

  @ApiProperty({ description: 'Previous subscription end date' })
  previousEndDate?: string;

  @ApiProperty({ description: 'New subscription end date' })
  newEndDate: string;

  @ApiProperty({ description: 'Proration amount (if applicable)' })
  prorationAmount?: number;

  @ApiProperty({ description: 'Operation notes' })
  notes?: string;

  @ApiProperty({ description: 'Related subscription request ID' })
  subscriptionRequestId?: string;

  @ApiProperty({ description: 'Operation metadata' })
  metadata?: any;

  @ApiProperty({ description: 'When the operation was created' })
  createdAt: string;
}

export class SubscriptionHistoryDto {
  @ApiProperty({ 
    type: [SubscriptionHistoryItemDto],
    description: 'List of subscription history items' 
  })
  data: SubscriptionHistoryItemDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: {
      total: 150,
      page: 1,
      limit: 20,
      totalPages: 8,
      hasNext: true,
      hasPrevious: false
    }
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}