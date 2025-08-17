import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsObject } from 'class-validator';

export class UploadFileDto {
  @ApiProperty({
    description: 'Optional description for the file',
    example: 'Client profile photo',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Optional metadata for the file',
    example: { category: 'profile', clientId: '123' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
