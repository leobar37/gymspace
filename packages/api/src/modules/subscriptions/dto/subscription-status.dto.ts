import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionStatus } from '@gymspace/shared';

export class SubscriptionStatusDto {
  @ApiProperty({
    description: 'Organization ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  organizationId: string;

  @ApiProperty({
    description: 'Current subscription plan',
  })
  subscriptionPlan: {
    id: string;
    name: string;
    price: any;
    billingFrequency: string;
    maxGyms: number;
    maxClientsPerGym: number;
    maxUsersPerGym: number;
    features: any;
  };

  @ApiProperty({
    description: 'Subscription status',
    enum: SubscriptionStatus,
    example: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @ApiProperty({
    description: 'Subscription start date',
    type: Date,
  })
  subscriptionStart: Date;

  @ApiProperty({
    description: 'Subscription end date',
    type: Date,
  })
  subscriptionEnd: Date;

  @ApiProperty({
    description: 'Days remaining in subscription',
    example: 25,
  })
  daysRemaining: number;

  @ApiProperty({
    description: 'Whether the subscription is expired',
    example: false,
  })
  isExpired: boolean;

  @ApiProperty({
    description: 'Whether this is a free plan',
    example: true,
  })
  isFreePlan: boolean;

  @ApiProperty({
    description: 'Current usage statistics',
  })
  usage: {
    gyms: number;
    totalClients: number;
    totalUsers: number;
  };

  @ApiProperty({
    description: 'Usage limits based on plan',
  })
  limits: {
    maxGyms: number;
    maxClientsPerGym: number;
    maxUsersPerGym: number;
  };
}