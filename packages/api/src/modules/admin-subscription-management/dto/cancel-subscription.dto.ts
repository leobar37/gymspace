import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CancelSubscriptionDto {
  @ApiProperty({
    example: 'Customer requested cancellation',
    description: 'Reason for cancellation',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({
    example: false,
    description: 'Whether to terminate immediately or at end of billing period (default: false)',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  immediateTermination?: boolean;

  @ApiProperty({
    example: 'Additional context about the cancellation',
    description: 'Additional notes',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}