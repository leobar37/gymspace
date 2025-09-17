import { ApiProperty } from '@nestjs/swagger';

export class OrganizationUsageDto {
  @ApiProperty({ description: 'Organization ID' })
  organizationId: string;

  @ApiProperty({ description: 'Organization name' })
  organizationName: string;

  @ApiProperty({ description: 'Current plan name' })
  planName: string;

  @ApiProperty({ description: 'Number of gyms' })
  gymCount: number;

  @ApiProperty({ description: 'Total clients across all gyms' })
  clientCount: number;

  @ApiProperty({ description: 'Total users (collaborators)' })
  userCount: number;

  @ApiProperty({ description: 'Plan limits utilization percentage' })
  utilizationPercentage: number;

  @ApiProperty({ description: 'Whether organization is approaching limits' })
  nearingLimits: boolean;

  @ApiProperty({ description: 'Last activity date' })
  lastActivityAt: string;

  @ApiProperty({ description: 'Subscription start date' })
  subscriptionStartDate: string;
}

export class UsageTrendsDto {
  @ApiProperty({ description: 'Period for usage trends' })
  period: string;

  @ApiProperty({ description: 'Start date of the analytics period' })
  startDate: string;

  @ApiProperty({ description: 'End date of the analytics period' })
  endDate: string;

  @ApiProperty({ 
    type: [OrganizationUsageDto],
    description: 'Usage data for all organizations' 
  })
  organizationUsage: OrganizationUsageDto[];

  @ApiProperty({ 
    type: [Object],
    description: 'Average utilization trends over time',
    example: [{ date: '2024-01-01', avgUtilization: 65.5, totalOrgs: 150 }]
  })
  utilizationTrend: Array<{
    date: string;
    avgUtilization: number;
    totalOrgs: number;
  }>;

  @ApiProperty({ 
    type: [Object],
    description: 'Feature usage statistics',
    example: [{ feature: 'inventory_management', usage: 80, totalEligible: 100 }]
  })
  featureUsage: Array<{
    feature: string;
    usage: number;
    totalEligible: number;
    usagePercentage: number;
  }>;

  @ApiProperty({ description: 'Organizations nearing plan limits' })
  nearingLimitsCount: number;

  @ApiProperty({ description: 'Date when analytics were generated' })
  generatedAt: string;
}