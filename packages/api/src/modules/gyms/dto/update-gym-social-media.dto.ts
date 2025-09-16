import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, Matches } from 'class-validator';

export class UpdateGymSocialMediaDto {
  @ApiProperty({
    description: 'Facebook page URL',
    example: 'https://facebook.com/gymspace',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: 'Facebook must be a valid URL' })
  facebook?: string;

  @ApiProperty({
    description: 'Instagram username',
    example: '@gymspace',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^@?[a-zA-Z0-9._]+$/, {
    message: 'Instagram username must be valid',
  })
  instagram?: string;

  @ApiProperty({
    description: 'WhatsApp phone number',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'WhatsApp must be a valid phone number',
  })
  whatsapp?: string;

  @ApiProperty({
    description: 'Twitter/X username',
    example: '@gymspace',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^@?[a-zA-Z0-9_]+$/, {
    message: 'Twitter username must be valid',
  })
  twitter?: string;

  @ApiProperty({
    description: 'LinkedIn page URL',
    example: 'https://linkedin.com/company/gymspace',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: 'LinkedIn must be a valid URL' })
  linkedin?: string;

  @ApiProperty({
    description: 'YouTube channel URL',
    example: 'https://youtube.com/c/gymspace',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: 'YouTube must be a valid URL' })
  youtube?: string;

  @ApiProperty({
    description: 'TikTok username',
    example: '@gymspace',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^@?[a-zA-Z0-9._]+$/, {
    message: 'TikTok username must be valid',
  })
  tiktok?: string;
}
