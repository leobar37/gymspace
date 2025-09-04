import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsUrl,
  IsObject,
  IsBoolean,
  Matches,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class BusinessHoursDto {
  @ApiProperty({ example: '08:00', description: 'Opening time in HH:MM format' })
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Time must be in HH:MM format' })
  open: string;

  @ApiProperty({ example: '22:00', description: 'Closing time in HH:MM format' })
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Time must be in HH:MM format' })
  close: string;

  @ApiProperty({ example: false, description: 'Whether the gym is closed on this day' })
  @IsBoolean()
  closed: boolean;
}

class WeeklyScheduleDto {
  @ApiProperty({ type: BusinessHoursDto })
  @ValidateNested()
  @Type(() => BusinessHoursDto)
  monday: BusinessHoursDto;

  @ApiProperty({ type: BusinessHoursDto })
  @ValidateNested()
  @Type(() => BusinessHoursDto)
  tuesday: BusinessHoursDto;

  @ApiProperty({ type: BusinessHoursDto })
  @ValidateNested()
  @Type(() => BusinessHoursDto)
  wednesday: BusinessHoursDto;

  @ApiProperty({ type: BusinessHoursDto })
  @ValidateNested()
  @Type(() => BusinessHoursDto)
  thursday: BusinessHoursDto;

  @ApiProperty({ type: BusinessHoursDto })
  @ValidateNested()
  @Type(() => BusinessHoursDto)
  friday: BusinessHoursDto;

  @ApiProperty({ type: BusinessHoursDto })
  @ValidateNested()
  @Type(() => BusinessHoursDto)
  saturday: BusinessHoursDto;

  @ApiProperty({ type: BusinessHoursDto })
  @ValidateNested()
  @Type(() => BusinessHoursDto)
  sunday: BusinessHoursDto;
}

class SocialMediaDto {
  @ApiPropertyOptional({ example: 'https://facebook.com/mygym' })
  @IsOptional()
  @IsUrl()
  facebook?: string;

  @ApiPropertyOptional({ example: 'https://instagram.com/mygym' })
  @IsOptional()
  @IsUrl()
  instagram?: string;

  @ApiPropertyOptional({ example: 'https://twitter.com/mygym' })
  @IsOptional()
  @IsUrl()
  twitter?: string;

  @ApiPropertyOptional({ example: 'https://www.mygym.com' })
  @IsOptional()
  @IsUrl()
  website?: string;
}

export class UpdateGymSettingsDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Gym ID to update' })
  @IsNotEmpty()
  @IsString()
  gymId: string;

  // Basic Information
  @ApiProperty({ example: 'PowerFit Downtown', description: 'Name of the gym' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: '123 Main Street', description: 'Street address' })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({ example: 'New York', description: 'City' })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({ example: 'NY', description: 'State or province' })
  @IsNotEmpty()
  @IsString()
  state: string;

  @ApiProperty({ example: '10001', description: 'Postal/ZIP code' })
  @IsNotEmpty()
  @IsString()
  postalCode: string;

  @ApiProperty({ example: '+1234567890', description: 'Gym contact phone' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ example: 'info@powerfit.com', description: 'Gym contact email' })
  @IsNotEmpty()
  @IsString()
  email: string;

  // Business Hours
  @ApiProperty({ type: WeeklyScheduleDto, description: 'Weekly business hours schedule' })
  @ValidateNested()
  @Type(() => WeeklyScheduleDto)
  businessHours: WeeklyScheduleDto;

  // Capacity and Description
  @ApiProperty({ example: 150, description: 'Maximum gym capacity' })
  @IsNumber()
  @Min(1)
  @Max(10000)
  capacity: number;

  @ApiPropertyOptional({
    example: 'The best gym in downtown with state-of-the-art equipment',
    description: 'Gym description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  // Social Media
  @ApiPropertyOptional({ type: SocialMediaDto, description: 'Social media links' })
  @IsOptional()
  @ValidateNested()
  @Type(() => SocialMediaDto)
  socialMedia?: SocialMediaDto;

  // Branding
  @ApiPropertyOptional({ example: 'https://example.com/logo.png', description: 'Logo URL' })
  @IsOptional()
  @IsUrl()
  logo?: string;

  @ApiPropertyOptional({ example: 'https://example.com/cover.png', description: 'Cover photo URL' })
  @IsOptional()
  @IsUrl()
  coverPhoto?: string;

  @ApiPropertyOptional({ example: '#FF0000', description: 'Primary brand color' })
  @IsOptional()
  @Matches(/^#[0-9A-F]{6}$/i, { message: 'Color must be in hex format (#RRGGBB)' })
  primaryColor?: string;
}
