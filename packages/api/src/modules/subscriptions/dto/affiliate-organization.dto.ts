import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AffiliateOrganizationDto {
  @IsUUID()
  @ApiProperty({
    description: 'Subscription plan ID to affiliate with (must be a free plan)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  subscriptionPlanId: string;
}
