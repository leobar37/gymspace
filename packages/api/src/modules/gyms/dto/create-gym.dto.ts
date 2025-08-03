import { IsString, IsOptional, IsObject, IsNumber, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGymDto {
  @ApiProperty({ example: 'PowerFit Downtown' })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({ example: '123 Main Street', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'New York', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ example: 'NY', required: false })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ example: '10001', required: false })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'info@powerfit.com', required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ example: '08:00', required: false })
  @IsOptional()
  @IsString()
  openingTime?: string;

  @ApiProperty({ example: '22:00', required: false })
  @IsOptional()
  @IsString()
  closingTime?: string;

  @ApiProperty({ example: 150, required: false })
  @IsOptional()
  @IsNumber()
  capacity?: number;

  @ApiProperty({
    example: {
      hasParking: true,
      hasShowers: true,
      hasLockers: true,
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  amenities?: Record<string, any>;

  @ApiProperty({
    example: {
      logo: 'https://example.com/logo.png',
      primaryColor: '#FF0000',
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}
