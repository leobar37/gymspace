import { ApiProperty } from '@nestjs/swagger';

export class SubscriptionPlanDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Premium' })
  name: string;

  @ApiProperty({
    example: { PEN: { currency: 'PEN', value: 295 } },
    description: 'Multi-currency pricing object',
  })
  price: {
    PEN?: { currency: 'PEN'; value: number };
    USD?: { currency: 'USD'; value: number };
    COP?: { currency: 'COP'; value: number };
    MXN?: { currency: 'MXN'; value: number };
  };

  @ApiProperty({ example: 'monthly' })
  billingFrequency: string;

  @ApiProperty({ example: 30, required: false })
  duration?: number;

  @ApiProperty({ example: 'DAY', required: false })
  durationPeriod?: string;

  @ApiProperty({ example: 3 })
  maxGyms: number;

  @ApiProperty({ example: 500 })
  maxClientsPerGym: number;

  @ApiProperty({ example: 10 })
  maxUsersPerGym: number;

  @ApiProperty({
    example: { prioritySupport: true, advancedReports: true },
    description: 'Feature configuration for the plan',
  })
  features: Record<string, any>;

  @ApiProperty({ example: 'Plan for growing gyms', required: false })
  description?: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  updatedAt: Date;

  @ApiProperty({ example: 5, description: 'Number of active subscriptions', required: false })
  activeSubscriptions?: number;

  @ApiProperty({ example: 10, description: 'Total organizations using this plan', required: false })
  totalOrganizations?: number;
}