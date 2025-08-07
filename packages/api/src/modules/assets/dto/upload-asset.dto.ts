import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UploadAssetDto {
  @ApiProperty({
    description: 'Optional description for the asset',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @ApiProperty({
    description: 'Additional metadata for the asset',
    required: false,
  })
  @IsOptional()
  metadata?: Record<string, any>;
}