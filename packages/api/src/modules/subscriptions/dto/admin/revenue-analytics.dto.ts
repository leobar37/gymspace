import { ApiProperty } from '@nestjs/swagger';

export class RevenueMetricsDto {
  @ApiProperty({ description: 'Total monthly recurring revenue' })
  totalMrr: number;

  @ApiProperty({ description: 'Total annual recurring revenue' })
  totalArr: number;

  @ApiProperty({ description: 'New MRR in period' })
  newMrr: number;

  @ApiProperty({ description: 'Churned MRR in period' })
  churnedMrr: number;

  @ApiProperty({ description: 'Expansion MRR (upgrades) in period' })
  expansionMrr: number;

  @ApiProperty({ description: 'Contraction MRR (downgrades) in period' })
  contractionMrr: number;

  @ApiProperty({ description: 'Net MRR change in period' })
  netMrrChange: number;

  @ApiProperty({ description: 'Average revenue per user' })
  arpu: number;

  @ApiProperty({ description: 'Customer lifetime value' })
  ltv: number;
}

export class RevenuePlanBreakdownDto {
  @ApiProperty({ description: 'Plan ID' })
  planId: string;

  @ApiProperty({ description: 'Plan name' })
  planName: string;

  @ApiProperty({ description: 'Monthly recurring revenue for this plan' })
  mrr: number;

  @ApiProperty({ description: 'Annual recurring revenue for this plan' })
  arr: number;

  @ApiProperty({ description: 'Percentage of total revenue' })
  revenueShare: number;

  @ApiProperty({ description: 'Active subscription count' })
  activeSubscriptions: number;

  @ApiProperty({ description: 'Average revenue per user for this plan' })
  arpu: number;
}

export class RevenueAnalyticsDto {
  @ApiProperty({ description: 'Query period used for this revenue data' })
  period: string;

  @ApiProperty({ description: 'Start date of the analytics period' })
  startDate: string;

  @ApiProperty({ description: 'End date of the analytics period' })
  endDate: string;

  @ApiProperty({ description: 'Overall revenue metrics' })
  metrics: RevenueMetricsDto;

  @ApiProperty({ 
    type: [RevenuePlanBreakdownDto],
    description: 'Revenue breakdown by plan' 
  })
  planBreakdown: RevenuePlanBreakdownDto[];

  @ApiProperty({ 
    type: [Object],
    description: 'Monthly revenue trend over time',
    example: [{ month: '2024-01', revenue: 10000, growth: 5.2 }]
  })
  monthlyTrend: Array<{
    month: string;
    revenue: number;
    growth: number;
  }>;

  @ApiProperty({ description: 'Date when analytics were generated' })
  generatedAt: string;
}