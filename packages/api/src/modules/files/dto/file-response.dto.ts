import { ApiProperty } from '@nestjs/swagger';

export class FileResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the file',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  id: string;

  @ApiProperty({
    description: 'Generated unique filename',
    example: 'a1b2c3d4e5f6.jpg',
  })
  filename: string;

  @ApiProperty({
    description: 'Original filename as uploaded',
    example: 'profile_photo.jpg',
  })
  originalName: string;

  @ApiProperty({
    description: 'Path to the file in storage',
    example: 'files/a1b2c3d4e5f6.jpg',
  })
  filePath: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1024000,
  })
  fileSize: number;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'image/jpeg',
  })
  mimeType: string;

  @ApiProperty({
    description: 'Status of the file',
    example: 'active',
  })
  status: string;

  @ApiProperty({
    description: 'Optional metadata',
    example: { category: 'profile' },
    required: false,
  })
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Optional description',
    example: 'Client profile photo',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Date when the file was created',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Date when the file was last updated',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: string;

  @ApiProperty({
    description: 'User ID who owns the file',
    example: 'user-123',
  })
  userId: string;

  @ApiProperty({
    description: 'Preview URL for the file if it is previewable',
    example: 'https://api.example.com/api/v1/files/f47ac10b-58cc-4372-a567-0e02b2c3d479/render',
    required: false,
  })
  previewUrl: string | null;
}
