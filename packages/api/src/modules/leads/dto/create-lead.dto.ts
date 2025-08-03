import { IsString, IsEmail, IsOptional, IsUUID, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLeadDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+1234567890' })
  @IsString()
  phone: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  gymId: string;

  @ApiProperty({ example: 'I would like to know more about membership plans', required: false })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiProperty({ example: 'Website Contact Form', required: false })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiProperty({
    example: {
      preferredContactTime: 'morning',
      interests: ['weight loss', 'muscle gain'],
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
