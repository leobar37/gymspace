import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsBoolean, IsEnum, IsUUID, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { CancellationReason } from '@prisma/client';

// ===============================
// UPGRADE SUBSCRIPTION DTOs
// ===============================

export class UpgradeSubscriptionDto {
  @ApiProperty({
    description: 'ID of the new subscription plan to upgrade to',
    example: 'uuid-of-plan',
  })
  @IsString()
  @IsUUID()
  newPlanId: string;

  @ApiPropertyOptional({
    description: 'Effective date for the upgrade (defaults to current date)',
    example: '2024-03-15T10:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @ApiPropertyOptional({
    description: 'Whether to apply the upgrade immediately (default: true)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  immediate?: boolean;

  @ApiPropertyOptional({
    description: 'Whether to enable proration calculation (default: true)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  prorationEnabled?: boolean;
}

export class UpgradeSubscriptionResponseDto {
  @ApiProperty({
    description: 'Transaction success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Effective date of the upgrade',
    example: '2024-03-15T10:00:00.000Z',
  })
  effectiveDate: string;

  @ApiProperty({
    description: 'Previous subscription details',
  })
  oldSubscription: {
    id: string;
    planId: string;
    planName: string;
    endDate: string;
  };

  @ApiProperty({
    description: 'New subscription details',
  })
  newSubscription: {
    id: string;
    planId: string;
    planName: string;
    startDate: string;
    endDate: string;
  };

  @ApiPropertyOptional({
    description: 'Proration calculation details',
  })
  proration?: {
    remainingDays: number;
    totalDays: number;
    unusedPercentage: number;
    currentPlanPrice: number;
    newPlanPrice: number;
    creditAmount: number;
    chargeAmount: number;
    netAmount: number;
    description: string;
  };

  @ApiProperty({
    description: 'Operation record ID for tracking',
    example: 'uuid-of-operation',
  })
  operationId: string;
}

// ===============================
// CANCELLATION DTOs
// ===============================

export class CancelSubscriptionDto {
  @ApiProperty({
    description: 'Reason for cancellation',
    enum: CancellationReason,
    example: 'cost_too_high',
  })
  @IsEnum(CancellationReason)
  reason: CancellationReason;

  @ApiPropertyOptional({
    description: 'Additional description for the cancellation reason',
    example: 'Budget constraints due to economic situation',
  })
  @IsOptional()
  @IsString()
  reasonDescription?: string;

  @ApiPropertyOptional({
    description: 'Effective date for cancellation (defaults to current date)',
    example: '2024-03-15T10:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @ApiPropertyOptional({
    description: 'Whether to cancel immediately or at the end of current period (default: false)',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  immediate?: boolean;

  @ApiPropertyOptional({
    description: 'Whether to calculate refund for unused portion (default: true)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  refundEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Whether retention offer was made',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  retentionOffered?: boolean;

  @ApiPropertyOptional({
    description: 'Details of retention offer if applicable',
    example: 'Offered 50% discount for next 3 months',
  })
  @IsOptional()
  @IsString()
  retentionDetails?: string;
}

export class CancelSubscriptionResponseDto {
  @ApiProperty({
    description: 'Cancellation success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Effective date of cancellation',
    example: '2024-03-15T10:00:00.000Z',
  })
  effectiveDate: string;

  @ApiProperty({
    description: 'Cancelled subscription details',
  })
  subscription: {
    id: string;
    planId: string;
    planName: string;
    status: string;
  };

  @ApiProperty({
    description: 'Cancellation record details',
  })
  cancellation: {
    id: string;
    reason: CancellationReason;
    reasonDescription?: string;
    refundAmount?: number;
    retentionOffered: boolean;
    retentionDetails?: string;
  };

  @ApiPropertyOptional({
    description: 'Refund amount if applicable',
    example: 25.50,
  })
  refundAmount?: number;
}

// ===============================
// RENEWAL DTOs
// ===============================

export class RenewSubscriptionDto {
  @ApiPropertyOptional({
    description: 'ID of the plan to renew with (defaults to current plan)',
    example: 'uuid-of-plan',
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  planId?: string;

  @ApiPropertyOptional({
    description: 'Custom duration for renewal (overrides plan default)',
    example: 12,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  duration?: number;

  @ApiPropertyOptional({
    description: 'Duration period for custom duration',
    enum: ['DAY', 'MONTH'],
    example: 'MONTH',
  })
  @IsOptional()
  @IsEnum(['DAY', 'MONTH'])
  durationPeriod?: 'DAY' | 'MONTH';

  @ApiPropertyOptional({
    description: 'Effective date for renewal (defaults to current subscription end date)',
    example: '2024-03-15T10:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @ApiPropertyOptional({
    description: 'Whether to extend current subscription period (default: true)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  extendCurrent?: boolean;
}

export class RenewSubscriptionResponseDto {
  @ApiProperty({
    description: 'Renewal success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Effective date of renewal',
    example: '2024-03-15T10:00:00.000Z',
  })
  effectiveDate: string;

  @ApiProperty({
    description: 'Previous subscription details',
  })
  oldSubscription: {
    id: string;
    planId: string;
    planName: string;
    endDate: string;
  };

  @ApiProperty({
    description: 'New/renewed subscription details',
  })
  newSubscription: {
    id: string;
    planId: string;
    planName: string;
    startDate: string;
    endDate: string;
  };

  @ApiProperty({
    description: 'Operation record ID for tracking',
    example: 'uuid-of-operation',
  })
  operationId: string;
}

// ===============================
// PRORATION CALCULATION DTOs
// ===============================

export class CalculateProrationDto {
  @ApiProperty({
    description: 'ID of the new subscription plan',
    example: 'uuid-of-plan',
  })
  @IsString()
  @IsUUID()
  newPlanId: string;

  @ApiPropertyOptional({
    description: 'Effective date for the change (defaults to current date)',
    example: '2024-03-15T10:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;
}

export class ProrationResponseDto {
  @ApiProperty({
    description: 'Remaining days in current billing period',
    example: 15,
  })
  remainingDays: number;

  @ApiProperty({
    description: 'Total days in current billing period',
    example: 30,
  })
  totalDays: number;

  @ApiProperty({
    description: 'Percentage of billing period unused',
    example: 50.0,
  })
  unusedPercentage: number;

  @ApiProperty({
    description: 'Current plan price',
    example: 99.99,
  })
  currentPlanPrice: number;

  @ApiProperty({
    description: 'New plan price',
    example: 149.99,
  })
  newPlanPrice: number;

  @ApiProperty({
    description: 'Credit amount for unused current plan',
    example: 49.995,
  })
  creditAmount: number;

  @ApiProperty({
    description: 'Charge amount for new plan',
    example: 74.995,
  })
  chargeAmount: number;

  @ApiProperty({
    description: 'Net amount (positive = charge, negative = refund)',
    example: 25.0,
  })
  netAmount: number;

  @ApiProperty({
    description: 'Human-readable description of the proration',
    example: 'Upgrade from Basic to Pro | 15 days remaining (50.00% of billing period) | Credit for unused Basic: 49.995 USD | Charge for Pro: 74.995 USD',
  })
  description: string;

  @ApiProperty({
    description: 'Currency code',
    example: 'USD',
  })
  currency: string;
}

// ===============================
// ENHANCED ORGANIZATION DTOs
// ===============================

export class OrganizationSubscriptionDetailsDto {
  @ApiProperty({
    description: 'Organization basic information',
  })
  organization: {
    id: string;
    name: string;
    country: string;
    currency: string;
    timezone: string;
    createdAt: string;
  };

  @ApiProperty({
    description: 'Current subscription details',
  })
  currentSubscription: {
    id: string;
    planId: string;
    planName: string;
    status: string;
    startDate: string;
    endDate: string;
    isExpiring: boolean;
    isExpired: boolean;
    daysUntilExpiration: number;
  };

  @ApiProperty({
    description: 'Plan details and limits',
  })
  plan: {
    id: string;
    name: string;
    description?: string;
    price: Record<string, number>;
    billingFrequency: string;
    maxGyms: number;
    maxClientsPerGym: number;
    maxUsersPerGym: number;
    features: any;
  };

  @ApiProperty({
    description: 'Current usage statistics',
  })
  usage: {
    gyms: {
      current: number;
      limit: number;
      percentage: number;
    };
    clients: {
      current: number;
      limit: number;
      percentage: number;
    };
    collaborators: {
      current: number;
      limit: number;
      percentage: number;
    };
  };

  @ApiProperty({
    description: 'Billing and renewal information',
  })
  billing: {
    renewalWindow: {
      startDate: string;
      endDate: string;
      isActive: boolean;
    };
    nextBillingDate?: string;
    canRenew: boolean;
    canUpgrade: boolean;
    canDowngrade: boolean;
  };

  @ApiPropertyOptional({
    description: 'Recent subscription operations',
  })
  recentOperations?: Array<{
    id: string;
    operationType: string;
    effectiveDate: string;
    fromPlanName?: string;
    toPlanName?: string;
    prorationAmount?: number;
    createdAt: string;
  }>;

  @ApiProperty({
    description: 'Organization gyms list',
  })
  gyms: Array<{
    id: string;
    name: string;
    address?: string;
    isActive: boolean;
    clientsCount: number;
    collaboratorsCount: number;
  }>;
}