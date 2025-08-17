import { ApiProperty } from '@nestjs/swagger';

export class AssetResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the asset',
  })
  id: string;

  @ApiProperty({
    description: 'Generated filename for storage',
  })
  filename: string;

  @ApiProperty({
    description: 'Original filename uploaded by user',
  })
  originalName: string;

  @ApiProperty({
    description: 'File size in bytes',
  })
  fileSize: number;

  @ApiProperty({
    description: 'MIME type of the file',
  })
  mimeType: string;

  @ApiProperty({
    description: 'Status of the asset',
    enum: ['active', 'deleted'],
  })
  status: string;

  @ApiProperty({
    description: 'Optional description',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Additional metadata',
    required: false,
  })
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Preview URL for previewable assets (images, PDFs, videos)',
    required: false,
  })
  previewUrl?: string;

  @ApiProperty({
    description: 'User ID who uploaded the asset',
  })
  uploadedBy: string;

  @ApiProperty({
    description: 'Creation timestamp',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Last update timestamp',
  })
  updatedAt: string;

  @ApiProperty({
    description: 'File path in storage',
  })
  filePath: string;

  @ApiProperty({
    description: 'Entity type this asset belongs to',
    required: false,
  })
  entityType?: string;

  @ApiProperty({
    description: 'Entity ID this asset belongs to',
    required: false,
  })
  entityId?: string;
}
