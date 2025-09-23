import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class PriceDto {
  @ApiProperty({ example: 'PEN' })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty({ example: 110 })
  @IsInt()
  @Min(0)
  value: number;
}

export class PricingDto {
  @ApiProperty({ type: PriceDto, description: 'Peru pricing' })
  @ValidateNested()
  @Type(() => PriceDto)
  PEN: PriceDto;
}

export class CreateSubscriptionPlanDto {
  @ApiProperty({ example: 'Premium' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ type: PricingDto })
  @IsObject()
  @ValidateNested()
  @Type(() => PricingDto)
  price: PricingDto;

  @ApiProperty({ example: 'monthly' })
  @IsString()
  @IsNotEmpty()
  billingFrequency: string;

  @ApiProperty({ example: 30, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  @ApiProperty({ enum: ['DAY', 'MONTH'], required: false })
  @IsOptional()
  @IsEnum(['DAY', 'MONTH'])
  durationPeriod?: 'DAY' | 'MONTH';

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  maxGyms: number;

  @ApiProperty({ example: 500 })
  @IsInt()
  @Min(1)
  maxClientsPerGym: number;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(1)
  maxUsersPerGym: number;

  @ApiProperty({
    example: { prioritySupport: true, advancedReports: true },
    description: 'Feature flags for the plan',
  })
  @IsObject()
  features: Record<string, any>;

  @ApiProperty({ example: 'Plan for growing gyms', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}