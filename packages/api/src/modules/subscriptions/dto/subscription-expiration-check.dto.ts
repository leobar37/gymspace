import { ApiProperty } from '@nestjs/swagger';

export class SubscriptionExpirationCheckDto {
  @ApiProperty({
    description: 'Number of subscriptions updated',
    example: 5,
  })
  updated: number;

  @ApiProperty({
    description: 'List of expired organization names with IDs',
    example: ['Test Organization (123e4567-e89b-12d3-a456-426614174000)'],
    type: [String],
  })
  expired: string[];
}