import { ApiProperty } from '@nestjs/swagger';
import { AssetStatus } from '@prisma/client';

export class AssetResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  filename: string;

  @ApiProperty()
  originalName: string;

  @ApiProperty()
  fileSize: number;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  entityType: string;

  @ApiProperty()
  entityId: string;

  @ApiProperty({
    enum: AssetStatus,
  })
  status: AssetStatus;

  @ApiProperty({
    required: false,
  })
  metadata?: Record<string, any>;

  @ApiProperty({
    required: false,
  })
  description?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({
    description: 'User who uploaded the asset',
  })
  uploadedBy: {
    id: string;
    name: string;
    email: string;
  };

  @ApiProperty({
    description: 'Signed URL for previewing the asset (valid for 7 days)',
    required: false,
    nullable: true,
  })
  previewUrl?: string | null;
}
