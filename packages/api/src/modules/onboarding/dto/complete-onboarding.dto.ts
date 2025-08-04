import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, MinLength } from 'class-validator';

export class CompleteOnboardingDto {
  // Owner data
  @ApiProperty({ example: 'John Doe', description: 'Full name of the gym owner' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'john@example.com', description: 'Email address for the owner account' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '+1234567890', description: 'Contact phone number' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ example: 'SecurePassword123!', description: 'Password for the owner account' })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: '123456', description: 'Email verification code' })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  verificationCode: string;

  // Organization data
  @ApiProperty({ example: 'My Fitness Center', description: 'Name of the organization/company' })
  @IsNotEmpty()
  @IsString()
  organizationName: string;

  @ApiProperty({ example: 'US', description: 'Country code (ISO 3166-1 alpha-2)' })
  @IsNotEmpty()
  @IsString()
  @Length(2, 2)
  country: string;

  @ApiProperty({ example: 'USD', description: 'Currency code (ISO 4217)' })
  @IsNotEmpty()
  @IsString()
  @Length(3, 3)
  currency: string;

  @ApiProperty({ example: 'America/New_York', description: 'IANA timezone identifier' })
  @IsNotEmpty()
  @IsString()
  timezone: string;

  // Subscription data
  @ApiProperty({
    example: 'uuid-here',
    description: 'Optional subscription plan ID. If not provided, default free plan will be used',
    required: false,
  })
  @IsOptional()
  @IsString()
  subscriptionPlanId?: string;
}
