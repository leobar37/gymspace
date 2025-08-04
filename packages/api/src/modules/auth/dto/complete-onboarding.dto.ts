import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsUUID,
  MinLength,
  IsOptional,
  ValidateNested,
  Length,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class GymDto {
  @ApiProperty({ example: 'Fitness Center Pro' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Av. Principal 123, Lima' })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({ example: '+51 999 999 999' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ example: 'The best gym in town', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'https://example.com/logo.png', required: false })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiProperty({ example: 'https://example.com/cover.png', required: false })
  @IsOptional()
  @IsString()
  coverPhoto?: string;
}

export class CompleteOnboardingDto {
  // Owner data
  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '+1234567890' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;

  // Organization data
  @ApiProperty({ example: 'My Fitness Center' })
  @IsNotEmpty()
  @IsString()
  organizationName: string;

  @ApiProperty({ example: 'PE' })
  @IsNotEmpty()
  @IsString()
  country: string;

  @ApiProperty({ example: 'PEN' })
  @IsNotEmpty()
  @IsString()
  currency: string;

  // Subscription
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsNotEmpty()
  @IsUUID()
  subscriptionPlanId: string;

  // First gym
  @ApiProperty({ type: GymDto })
  @ValidateNested()
  @Type(() => GymDto)
  gym: GymDto;

  // Email verification
  @ApiProperty({ example: '123456', description: 'Email verification code' })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  verificationCode: string;
}
