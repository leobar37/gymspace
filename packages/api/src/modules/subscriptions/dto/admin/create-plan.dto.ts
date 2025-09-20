import { IsString, IsNotEmpty, IsObject, IsInt, IsOptional, IsBoolean, Min, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum DurationPeriod {
  DAY = 'DAY',
  MONTH = 'MONTH',
}

export class CreatePlanDto {
  @ApiProperty({
    description: 'Plan name',
    example: 'Professional Plan',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Plan description',
    example: 'Full-featured plan for growing businesses',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Price configuration for different currencies',
    example: {
      USD: { value: 29.99 },
      EUR: { value: 24.99 },
      PEN: { value: 99.99 },
    },
  })
  @IsObject()
  price: Record<string, { value: number }>;

  @ApiProperty({
    description: 'Billing frequency',
    example: 'monthly',
  })
  @IsString()
  @IsNotEmpty()
  billingFrequency: string;

  @ApiProperty({
    description: 'Plan duration',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  @ApiProperty({
    description: 'Duration period',
    enum: DurationPeriod,
    example: DurationPeriod.MONTH,
    required: false,
  })
  @IsOptional()
  @IsEnum(DurationPeriod)
  durationPeriod?: DurationPeriod;

  @ApiProperty({
    description: 'Maximum number of gyms allowed',
    example: 5,
  })
  @IsInt()
  @Min(1)
  maxGyms: number;

  @ApiProperty({
    description: 'Maximum clients per gym',
    example: 100,
  })
  @IsInt()
  @Min(1)
  maxClientsPerGym: number;

  @ApiProperty({
    description: 'Maximum users per gym',
    example: 10,
  })
  @IsInt()
  @Min(1)
  maxUsersPerGym: number;

  @ApiProperty({
    description: 'Plan features',
    example: ['unlimited_storage', 'advanced_reports', 'api_access'],
  })
  @IsObject()
  features: Record<string, any>;

  @ApiProperty({
    description: 'Whether the plan is active',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Whether the plan is publicly available',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiProperty({
    description: 'Sort order for plan display',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}