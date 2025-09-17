import { ApiProperty } from '@nestjs/swagger';
import { DurationPeriod } from './create-plan.dto';

export class SubscriptionPlanResponseDto {
  @ApiProperty({
    description: 'Plan ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Plan name',
    example: 'Professional Plan',
  })
  name: string;

  @ApiProperty({
    description: 'Plan description',
    example: 'Full-featured plan for growing businesses',
  })
  description?: string;

  @ApiProperty({
    description: 'Price configuration for different currencies',
    example: {
      USD: { value: 29.99 },
      EUR: { value: 24.99 },
      PEN: { value: 99.99 },
    },
  })
  price: Record<string, { value: number }>;

  @ApiProperty({
    description: 'Billing frequency',
    example: 'monthly',
  })
  billingFrequency: string;

  @ApiProperty({
    description: 'Plan duration',
    example: 1,
  })
  duration?: number;

  @ApiProperty({
    description: 'Duration period',
    enum: DurationPeriod,
    example: DurationPeriod.MONTH,
  })
  durationPeriod?: DurationPeriod;

  @ApiProperty({
    description: 'Maximum number of gyms allowed',
    example: 5,
  })
  maxGyms: number;

  @ApiProperty({
    description: 'Maximum clients per gym',
    example: 100,
  })
  maxClientsPerGym: number;

  @ApiProperty({
    description: 'Maximum users per gym',
    example: 10,
  })
  maxUsersPerGym: number;

  @ApiProperty({
    description: 'Plan features',
    example: ['unlimited_storage', 'advanced_reports', 'api_access'],
  })
  features: Record<string, any>;

  @ApiProperty({
    description: 'Whether the plan is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Whether the plan is publicly available',
    example: true,
  })
  isPublic: boolean;

  @ApiProperty({
    description: 'Sort order for plan display',
    example: 1,
  })
  sortOrder: number;

  @ApiProperty({
    description: 'Plan creation date',
    example: '2023-12-01T10:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Plan last update date',
    example: '2023-12-01T10:00:00Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Number of organizations using this plan',
    example: 15,
  })
  organizationCount: number;
}