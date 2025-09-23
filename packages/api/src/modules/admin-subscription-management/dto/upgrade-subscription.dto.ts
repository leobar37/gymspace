import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpgradeSubscriptionDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID of the new subscription plan',
  })
  @IsString()
  @IsNotEmpty()
  newSubscriptionPlanId: string;

  @ApiProperty({
    example: true,
    description: 'Whether to upgrade immediately or at end of billing period (default: true)',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  immediateUpgrade?: boolean;

  @ApiProperty({
    example: 'Customer requested upgrade to premium',
    description: 'Additional notes about the upgrade',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}