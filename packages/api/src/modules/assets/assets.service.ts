import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../core/database/prisma.service';
import { IRequestContext } from '@gymspace/shared';
import {
  BusinessException,
  ResourceNotFoundException,
  ValidationException,
} from '../../common/exceptions';
import { UploadAssetDto, AssetEntityType } from './dto';
import { FileUploadResult } from './dto/fastify-file.interface';
import { AssetStatus } from '@prisma/client';
import * as AWS from 'aws-sdk';
import { randomUUID } from 'crypto';
import * as path from 'path';

@Injectable()
export class AssetsService implements OnModuleInit {
  private readonly logger = new Logger(AssetsService.name);
  private s3: AWS.S3;
  private bucket: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const s3Config = this.configService.get('s3');

    this.s3 = new AWS.S3({
      endpoint: s3Config.endpoint,
      accessKeyId: s3Config.accessKey,
      secretAccessKey: s3Config.secretKey,
      s3ForcePathStyle: true,
      signatureVersion: 'v4',
      region: s3Config.region,
    });

    this.bucket = s3Config.bucket;
  }

  /**
   * Initialize module and ensure bucket exists
   */
  async onModuleInit() {
    try {
      // Check if bucket exists
      await this.s3.headBucket({ Bucket: this.bucket }).promise();
      this.logger.log(`S3 bucket '${this.bucket}' verified successfully`);
    } catch (error) {
      if (error.statusCode === 404) {
        try {
          // Bucket doesn't exist, create it
          await this.s3.createBucket({ Bucket: this.bucket }).promise();
          this.logger.log(`S3 bucket '${this.bucket}' created successfully`);
        } catch (createError) {
          this.logger.error(
            `Failed to create S3 bucket '${this.bucket}': ${createError.message}`,
            createError.stack,
          );
          throw createError;
        }
      } else {
        this.logger.error(
          `Failed to verify S3 bucket '${this.bucket}': ${error.message}`,
          error.stack,
        );
        throw error;
      }
    }
  }

  /**
   * Upload a file and create asset record
   */
  async upload(context: IRequestContext, file: FileUploadResult, dto: UploadAssetDto) {
    const gymId = context.getGymId();
    const userId = context.getUserId();

    // Validate entity access based on type
    await this.validateEntityAccess(dto.entityType, dto.entityId, gymId);

    // Generate unique filename
    const fileExt = path.extname(file.filename);
    const uniqueFilename = `${randomUUID()}${fileExt}`;
    const filePath = `${gymId}/${dto.entityType}/${dto.entityId}/${uniqueFilename}`;

    try {
      // Upload to S3
      await this.s3
        .upload({
          Bucket: this.bucket,
          Key: filePath,
          Body: file.buffer,
          ContentType: file.mimetype,
          Metadata: {
            gymId,
            entityType: dto.entityType,
            entityId: dto.entityId,
            uploadedBy: userId,
          },
        })
        .promise();

      // Create asset record
      const asset = await this.prisma.asset.create({
        data: {
          filename: uniqueFilename,
          originalName: file.filename,
          filePath,
          fileSize: file.size,
          mimeType: file.mimetype,
          entityType: dto.entityType,
          entityId: dto.entityId,
          uploadedByUserId: userId,
          metadata: dto.metadata || {},
          status: AssetStatus.active,
          createdByUserId: userId,
        },
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Generate preview URL
      const previewUrl = await this.generatePreviewUrl(asset.filePath);

      return {
        ...asset,
        previewUrl,
      };
    } catch (error) {
      this.logger.error(`Failed to upload asset: ${error.message}`, error.stack);
      throw new BusinessException('Failed to upload file');
    }
  }

  /**
   * Get asset by ID
   */
  async findOne(context: IRequestContext, assetId: string) {
    const gymId = context.getGymId();

    const asset = await this.prisma.asset.findFirst({
      where: {
        id: assetId,
        status: AssetStatus.active,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!asset) {
      throw new ResourceNotFoundException('Asset', assetId);
    }

    // Validate gym access for the entity
    await this.validateEntityAccess(asset.entityType as AssetEntityType, asset.entityId, gymId);

    // Generate preview URL for the asset
    const previewUrl = await this.generatePreviewUrl(asset.filePath);

    return {
      ...asset,
      previewUrl,
    };
  }

  /**
   * Get download URL for an asset
   */
  async getDownloadUrl(context: IRequestContext, assetId: string) {
    const asset = await this.findOne(context, assetId);

    try {
      // Generate signed URL valid for 1 hour
      const url = await this.s3.getSignedUrlPromise('getObject', {
        Bucket: this.bucket,
        Key: asset.filePath,
        Expires: 3600, // 1 hour
      });

      return { url, filename: asset.originalName };
    } catch (error) {
      this.logger.error(`Failed to generate download URL: ${error.message}`, error.stack);
      throw new BusinessException('Failed to generate download URL');
    }
  }

  /**
   * Get asset stream for download
   */
  async download(context: IRequestContext, assetId: string) {
    const asset = await this.findOne(context, assetId);

    try {
      const stream = this.s3
        .getObject({
          Bucket: this.bucket,
          Key: asset.filePath,
        })
        .createReadStream();

      return {
        stream,
        filename: asset.originalName,
        mimeType: asset.mimeType,
        fileSize: asset.fileSize,
      };
    } catch (error) {
      this.logger.error(`Failed to download asset: ${error.message}`, error.stack);
      throw new BusinessException('Failed to download file');
    }
  }

  /**
   * Soft delete an asset
   */
  async delete(context: IRequestContext, assetId: string) {
    const asset = await this.findOne(context, assetId);
    const userId = context.getUserId();

    // Update asset status to deleted
    await this.prisma.asset.update({
      where: { id: assetId },
      data: {
        status: AssetStatus.deleted,
        deletedAt: new Date(),
        updatedByUserId: userId,
      },
    });

    // Note: We don't delete from S3 immediately for audit purposes
    // A scheduled task can clean up old deleted assets from S3

    return { message: 'Asset deleted successfully' };
  }

  /**
   * List assets for an entity
   */
  async findByEntity(context: IRequestContext, entityType: AssetEntityType, entityId: string) {
    const gymId = context.getGymId();

    // Validate entity access
    await this.validateEntityAccess(entityType, entityId, gymId);

    const assets = await this.prisma.asset.findMany({
      where: {
        entityType,
        entityId,
        status: AssetStatus.active,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Add preview URLs to all assets
    const assetsWithUrls = await Promise.all(
      assets.map(async (asset) => ({
        ...asset,
        previewUrl: await this.generatePreviewUrl(asset.filePath),
      })),
    );

    return assetsWithUrls;
  }

  /**
   * Validate entity access based on gym context
   */
  private async validateEntityAccess(entityType: AssetEntityType, entityId: string, gymId: string) {
    switch (entityType) {
      case AssetEntityType.GYM:
        const gym = await this.prisma.gym.findFirst({
          where: { id: entityId },
        });
        if (!gym || gym.id !== gymId) {
          throw new ResourceNotFoundException('Gym', entityId);
        }
        break;

      case AssetEntityType.CLIENT:
        const client = await this.prisma.gymClient.findFirst({
          where: { id: entityId, gymId },
        });
        if (!client) {
          throw new ResourceNotFoundException('Client', entityId);
        }
        break;

      case AssetEntityType.CONTRACT:
        const contract = await this.prisma.contract.findFirst({
          where: {
            id: entityId,
            gymClient: { gymId },
          },
        });
        if (!contract) {
          throw new ResourceNotFoundException('Contract', entityId);
        }
        break;

      case AssetEntityType.EVALUATION:
        const evaluation = await this.prisma.evaluation.findFirst({
          where: {
            id: entityId,
            gymClient: { gymId },
          },
        });
        if (!evaluation) {
          throw new ResourceNotFoundException('Evaluation', entityId);
        }
        break;

      case AssetEntityType.COLLABORATOR:
        const collaborator = await this.prisma.collaborator.findFirst({
          where: { id: entityId, gymId },
        });
        if (!collaborator) {
          throw new ResourceNotFoundException('Collaborator', entityId);
        }
        break;

      default:
        throw new ValidationException([{ field: 'entityType', message: 'Invalid entity type' }]);
    }
  }

  /**
   * Generate preview URL for a file
   */
  private async generatePreviewUrl(filePath: string): Promise<string | null> {
    try {
      // Generate a signed URL for preview (valid for 7 days for better caching)
      const previewUrl = await this.s3.getSignedUrlPromise('getObject', {
        Bucket: this.bucket,
        Key: filePath,
        Expires: 604800, // 7 days for better UX
      });

      return previewUrl;
    } catch (error) {
      this.logger.error(`Failed to generate preview URL: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Serve file directly (for rendering)
   */
  async serve(context: IRequestContext, assetId: string) {
    const asset = await this.findOne(context, assetId);

    try {
      const stream = this.s3
        .getObject({
          Bucket: this.bucket,
          Key: asset.filePath,
        })
        .createReadStream();

      return {
        stream,
        filename: asset.originalName,
        mimeType: asset.mimeType,
        fileSize: asset.fileSize,
      };
    } catch (error) {
      this.logger.error(`Failed to serve asset: ${error.message}`, error.stack);
      throw new BusinessException('Failed to serve file');
    }
  }
}
