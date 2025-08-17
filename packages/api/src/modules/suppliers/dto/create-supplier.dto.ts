import { IsString, IsOptional, IsEmail, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSupplierDto {
  @ApiProperty({ example: 'Acme Supplements Inc.', description: 'Supplier name' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({
    example: 'Premium supplement distributor with 20+ years of experience',
    description: 'Supplier contact information and description',
    required: false,
  })
  @IsOptional()
  @IsString()
  contactInfo?: string;

  @ApiProperty({
    example: '+1-555-123-4567',
    description: 'Supplier phone number',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    example: 'sales@acmesupplements.com',
    description: 'Supplier email',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    example: '123 Industrial Ave, Business District, NY 10001',
    description: 'Supplier address',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;
}
