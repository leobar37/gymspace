import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, Length, MinLength } from 'class-validator';

export class StartOnboardingDto {
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

  // Subscription
  @ApiProperty({ 
    example: '123e4567-e89b-12d3-a456-426614174000', 
    description: 'Selected subscription plan ID. If not provided, defaults to free plan (Gratuito)',
    required: false 
  })
  @IsUUID()
  @IsOptional()
  subscriptionPlanId?: string;

  // Email verification
  @ApiProperty({ example: '123456', description: 'Email verification code sent to the email' })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  verificationCode: string;
}