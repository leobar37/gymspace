import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../core/database/prisma.service';
import { StorageService } from '../../common/services/storage.service';
import { UploadAssetDto, AssetResponseDto } from './dto';
import { IRequestContext } from '@gymspace/shared';
import { FileUploadResult } from './dto/fastify-file.interface';
import { nanoid } from 'nanoid';
import { AssetStatus } from '@prisma/client';

@Injectable()
export class AssetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Upload a new asset
   */
  async upload(
    context: IRequestContext,
    file: FileUploadResult,
    dto: UploadAssetDto,
  ): Promise<AssetResponseDto> {
    const userId = context.getUserId();
    const gymId = context.getGymId();

    // Generate unique filename
    const fileExtension = file.filename.split('.').pop();
    const uniqueFilename = `${nanoid()}.${fileExtension}`;
    const filePath = `assets/${uniqueFilename}`;

    try {
      // Upload to storage
      await this.storageService.upload(filePath, file.buffer, {
        contentType: file.mimetype,
        metadata: {
          originalName: file.filename,
          uploadedBy: userId,
          gymId: gymId,
          ...(dto.metadata || {}),
        },
      });

      // Create database record
      const asset = await this.prisma.asset.create({
        data: {
          filename: uniqueFilename,
          originalName: file.filename,
          filePath: filePath,
          fileSize: file.size,
          mimeType: file.mimetype,
          description: dto.description,
          metadata: dto.metadata,
          status: AssetStatus.active,
          uploadedByUserId: userId,
          createdByUserId: userId,
          gymId: gymId, // IMPORTANTE: Asociar el asset al gimnasio
        },
      });

      return this.mapToDto(asset);
    } catch (error) {
      // Clean up storage if database save fails
      try {
        await this.storageService.delete(filePath);
      } catch (cleanupError) {
        console.error('Failed to cleanup uploaded file:', cleanupError);
      }

      throw new InternalServerErrorException('Failed to upload asset');
    }
  }

  /**
   * Get all assets for the current context
   */
  async findAll(context: IRequestContext): Promise<AssetResponseDto[]> {
    const gymId = context.getGymId();

    const assets = await this.prisma.asset.findMany({
      where: {
        gymId: gymId,
        status: AssetStatus.active,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return assets.map((asset) => this.mapToDto(asset));
  }

  /**
   * Get a single asset by ID
   */
  async findOne(context: IRequestContext, id: string): Promise<AssetResponseDto> {
    // Assets have unique IDs, so we don't need to filter by gymId
    const asset = await this.prisma.asset.findFirst({
      where: {
        id,
        status: AssetStatus.active,
        deletedAt: null,
      },
    });
    if (!asset) {
      throw new NotFoundException('Asset not found');
    }
    return this.mapToDto(asset);
  }

  /**
   * Get multiple assets by IDs
   */
  async findByIds(context: IRequestContext, ids: string[]): Promise<AssetResponseDto[]> {
    // Get the gym ID from context
    const gymId = context.getGymId();

    const whereClause: any = {
      id: { in: ids },
      gymId: gymId, // Filter by gymId
      status: AssetStatus.active,
      deletedAt: null,
    };

    const assets = await this.prisma.asset.findMany({
      where: whereClause,
    });

    return assets.map((asset) => this.mapToDto(asset));
  }

  /**
   * Get signed download URL for an asset
   */
  async getDownloadUrl(
    context: IRequestContext,
    id: string,
  ): Promise<{ url: string; filename: string }> {
    const asset = await this.findOne(context, id);

    const url = await this.storageService.getSignedUrl(asset.filePath, 'download');

    return {
      url,
      filename: asset.originalName,
    };
  }

  /**
   * Download an asset
   */
  async download(context: IRequestContext, id: string) {
    const asset = await this.findOne(context, id);

    const stream = await this.storageService.download(asset.filePath);

    return {
      stream,
      filename: asset.originalName,
      mimeType: asset.mimeType,
      fileSize: asset.fileSize,
    };
  }

  /**
   * Serve an asset for rendering (inline display)
   */
  async serve(context: IRequestContext, id: string) {
    // Same as download but with different headers in controller
    return this.download(context, id);
  }

  /**
   * Soft delete an asset
   */
  async delete(context: IRequestContext, id: string): Promise<void> {
    const userId = context.getUserId();

    await this.findOne(context, id); // Validate gym ownership

    // Soft delete in database
    await this.prisma.asset.update({
      where: { id },
      data: {
        status: AssetStatus.deleted,
        deletedAt: new Date(),
        updatedByUserId: userId,
      },
    });

    // Note: We're not deleting from storage immediately to allow recovery
    // A separate cleanup job can permanently delete old soft-deleted assets
  }

  /**
   * Map entity to DTO
   */
  private mapToDto(asset: any): AssetResponseDto {
    const baseUrl = this.configService.get('app.baseUrl');
    return {
      id: asset.id,
      filename: asset.filename,
      originalName: asset.originalName,
      filePath: asset.filePath,
      fileSize: asset.fileSize,
      mimeType: asset.mimeType,
      status: asset.status,
      metadata: asset.metadata,
      description: asset.description,
      createdAt: asset.createdAt.toISOString(),
      updatedAt: asset.updatedAt.toISOString(),
      uploadedBy: asset.uploadedByUserId,
      // Generate preview URL for images
      previewUrl: this.isPreviewable(asset.mimeType)
        ? `${baseUrl}/api/v1/assets/${asset.id}/render`
        : null,
    };
  }

  /**
   * Check if mime type is previewable
   */
  private isPreviewable(mimeType: string): boolean {
    const previewableTypes = ['image/', 'application/pdf', 'video/'];

    return previewableTypes.some((type) => mimeType.startsWith(type));
  }
}
