import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsUUID, IsOptional, MaxLength } from 'class-validator';

export enum AssetEntityType {
  GYM = 'gym',
  USER = 'user',
  CONTRACT = 'contract',
  EVALUATION = 'evaluation',
  CLIENT = 'client',
  COLLABORATOR = 'collaborator',
}

export class UploadAssetDto {
  @ApiProperty({
    description: 'Type of entity this asset belongs to',
    enum: AssetEntityType,
  })
  @IsEnum(AssetEntityType)
  entityType: AssetEntityType;

  @ApiProperty({
    description: 'ID of the entity this asset belongs to',
  })
  @IsUUID()
  entityId: string;

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
