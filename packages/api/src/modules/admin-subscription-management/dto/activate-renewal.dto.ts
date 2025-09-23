import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ActivateRenewalDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'New subscription plan ID (optional, uses current plan if not provided)',
    required: false,
  })
  @IsOptional()
  @IsString()
  subscriptionPlanId?: string;

  @ApiProperty({
    example: 3,
    description: 'Custom duration in months (optional)',
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationMonths?: number;

  @ApiProperty({
    example: 'Renewal requested by customer support',
    description: 'Notes about the renewal',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}