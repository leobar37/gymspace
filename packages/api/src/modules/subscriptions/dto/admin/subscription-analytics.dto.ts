import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsDateString } from 'class-validator';

export enum AnalyticsPeriod {
  LAST_7_DAYS = 'last_7_days',
  LAST_30_DAYS = 'last_30_days',
  LAST_90_DAYS = 'last_90_days',
  LAST_YEAR = 'last_year',
  CUSTOM = 'custom',
}

export class SubscriptionAnalyticsQueryDto {
  @ApiProperty({
    enum: AnalyticsPeriod,
    default: AnalyticsPeriod.LAST_30_DAYS,
    description: 'Time period for analytics',
  })
  @IsOptional()
  @IsEnum(AnalyticsPeriod)
  period?: AnalyticsPeriod = AnalyticsPeriod.LAST_30_DAYS;

  @ApiProperty({
    required: false,
    description: 'Start date for custom period (ISO string)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    required: false,
    description: 'End date for custom period (ISO string)',
    example: '2024-01-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class SubscriptionMetricsDto {
  @ApiProperty({ description: 'Total active subscriptions' })
  totalActiveSubscriptions: number;

  @ApiProperty({ description: 'Total inactive subscriptions' })
  totalInactiveSubscriptions: number;

  @ApiProperty({ description: 'New subscriptions in period' })
  newSubscriptions: number;

  @ApiProperty({ description: 'Cancelled subscriptions in period' })
  cancelledSubscriptions: number;

  @ApiProperty({ description: 'Upgraded subscriptions in period' })
  upgradedSubscriptions: number;

  @ApiProperty({ description: 'Downgraded subscriptions in period' })
  downgradedSubscriptions: number;

  @ApiProperty({ description: 'Subscription churn rate as percentage' })
  churnRate: number;

  @ApiProperty({ description: 'Subscription growth rate as percentage' })
  growthRate: number;

  @ApiProperty({ description: 'Average subscription duration in days' })
  averageSubscriptionDuration: number;
}

export class PlanUsageDto {
  @ApiProperty({ description: 'Subscription plan ID' })
  planId: string;

  @ApiProperty({ description: 'Plan name' })
  planName: string;

  @ApiProperty({ description: 'Active subscriptions count' })
  activeCount: number;

  @ApiProperty({ description: 'Total subscriptions ever created' })
  totalCount: number;

  @ApiProperty({ description: 'Percentage of total active subscriptions' })
  marketShare: number;

  @ApiProperty({ description: 'Plan monthly recurring revenue' })
  mrr: number;
}

export class TrendDataPointDto {
  @ApiProperty({ description: 'Date of the data point' })
  date: string;

  @ApiProperty({ description: 'Value for this date' })
  value: number;

  @ApiProperty({ description: 'Additional metric label' })
  label?: string;
}

export class SubscriptionAnalyticsDto {
  @ApiProperty({ description: 'Query period used for this analytics data' })
  period: AnalyticsPeriod;

  @ApiProperty({ description: 'Start date of the analytics period' })
  startDate: string;

  @ApiProperty({ description: 'End date of the analytics period' })
  endDate: string;

  @ApiProperty({ description: 'Overall subscription metrics' })
  metrics: SubscriptionMetricsDto;

  @ApiProperty({ 
    type: [PlanUsageDto],
    description: 'Usage statistics by plan' 
  })
  planUsage: PlanUsageDto[];

  @ApiProperty({ 
    type: [TrendDataPointDto],
    description: 'Subscription growth trend over time' 
  })
  growthTrend: TrendDataPointDto[];

  @ApiProperty({ 
    type: [TrendDataPointDto],
    description: 'Churn rate trend over time' 
  })
  churnTrend: TrendDataPointDto[];

  @ApiProperty({ description: 'Date when analytics were generated' })
  generatedAt: string;
}