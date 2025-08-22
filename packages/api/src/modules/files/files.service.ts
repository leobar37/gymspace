import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../core/database/prisma.service';
import { StorageService } from '../../common/services/storage.service';
import { UploadFileDto, FileResponseDto, FileUploadResult } from './dto';
import { IRequestContext } from '@gymspace/shared';
import { nanoid } from 'nanoid';

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Upload a new file with unique identifier generation
   */
  async upload(
    context: IRequestContext,
    file: FileUploadResult,
    dto: UploadFileDto,
  ): Promise<FileResponseDto> {
    const userId = context.getUserId();

    // Generate unique filename with nanoid to avoid collisions
    const fileExtension = file.filename.split('.').pop();
    const uniqueIdentifier = nanoid(12); // Generate 12-character unique ID
    const uniqueFilename = `${uniqueIdentifier}.${fileExtension}`;
    const filePath = `files/user/${userId}/${uniqueFilename}`;

    try {
      // Upload to storage
      console.log(`[FilesService] Uploading to storage: ${filePath}`);
      await this.storageService.upload(filePath, file.buffer, {
        contentType: file.mimetype,
        metadata: {
          originalName: file.filename,
          uploadedBy: userId,
          ...(dto.metadata || {}),
        },
      });

      const fileRecord = await this.prisma.file.create({
        data: {
          filename: uniqueFilename,
          originalName: file.filename,
          filePath: filePath,
          fileSize: file.size,
          mimeType: file.mimetype,
          description: dto.description,
          metadata: dto.metadata,
          status: 'active',
          userId: userId,
        },
      });
      
      const result = this.mapToDto(fileRecord);
 

      return result;
    } catch (error) {

      // Clean up storage if database save fails
      try {
        console.log(`[FilesService] Attempting to cleanup file from storage: ${filePath}`);
        await this.storageService.delete(filePath);
        console.log(`[FilesService] Cleanup successful`);
      } catch (cleanupError) {
        console.error('[FilesService] Failed to cleanup uploaded file:', cleanupError);
      }

      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  /**
   * Get all files for the current user
   */
  async findAll(context: IRequestContext): Promise<FileResponseDto[]> {
    const userId = context.getUserId();

    const files = await this.prisma.file.findMany({
      where: {
        userId,
        status: 'active',
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return files.map((file) => this.mapToDto(file));
  }

  /**
   * Get a single file by ID
   */
  async findOne(context: IRequestContext, id: string): Promise<FileResponseDto> {
    const userId = context.getUserId();

    const file = await this.prisma.file.findFirst({
      where: {
        id,
        userId, // Ensure file belongs to the current user
        status: 'active',
        deletedAt: null,
      },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return this.mapToDto(file);
  }

  /**
   * Get multiple files by IDs
   */
  async findByIds(context: IRequestContext, ids: string[]): Promise<FileResponseDto[]> {
    const userId = context.getUserId();

    const files = await this.prisma.file.findMany({
      where: {
        id: { in: ids },
        userId,
        status: 'active',
        deletedAt: null,
      },
    });

    return files.map((file) => this.mapToDto(file));
  }

  /**
   * Download a file
   */
  async download(context: IRequestContext, id: string) {
    const file = await this.findOne(context, id);

    const stream = await this.storageService.download(file.filePath);

    return {
      stream,
      filename: file.originalName,
      mimeType: file.mimeType,
      fileSize: file.fileSize,
    };
  }

  /**
   * Serve a file for rendering (inline display)
   */
  async serve(context: IRequestContext, id: string) {
    const isPublicAccess = context.getUserId() === 'public';
    
    // Build where clause based on access type
    const whereClause: any = {
      id,
      status: 'active',
      deletedAt: null,
    };

    // Only filter by userId if not public access
    if (!isPublicAccess) {
      whereClause.userId = context.getUserId();
    }

    const file = await this.prisma.file.findFirst({
      where: whereClause,
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    try {
      const stream = await this.storageService.download(file.filePath);

      return {
        stream,
        filename: file.originalName,
        mimeType: file.mimeType,
        fileSize: file.fileSize,
      };
    } catch (error) {
      console.error('[FilesService] Error downloading file for rendering:', error);
      throw new NotFoundException('File not found or cannot be accessed');
    }
  }

  /**
   * Soft delete a file
   */
  async delete(context: IRequestContext, id: string): Promise<void> {
    const userId = context.getUserId();

    console.log(`[FilesService] Starting file deletion`, {
      fileId: id,
      userId,
    });

    // Verify the file exists and belongs to the current user
    const file = await this.prisma.file.findFirst({
      where: {
        id,
        userId,
        status: 'active',
        deletedAt: null,
      },
    });

    if (!file) {
      console.log(`[FilesService] File not found for deletion`, {
        fileId: id,
        userId,
      });
      throw new NotFoundException('File not found');
    }

    console.log(`[FilesService] File found, proceeding with soft delete`, {
      fileId: id,
      originalName: file.originalName,
      filePath: file.filePath,
    });

    // Soft delete in database
    await this.prisma.file.update({
      where: { id },
      data: {
        status: 'deleted',
        deletedAt: new Date(),
      },
    });

    console.log(`[FilesService] File successfully soft deleted`, {
      fileId: id,
      originalName: file.originalName,
    });

    // Note: We're not deleting from storage immediately to allow recovery
    // A separate cleanup job can permanently delete old soft-deleted files
  }

  /**
   * Map entity to DTO
   */
  private mapToDto(file: {
    id: string;
    filename: string;
    originalName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    status: string;
    metadata: any;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
  }): FileResponseDto {
    const baseUrl = this.configService.get('app.baseUrl');
    return {
      id: file.id,
      filename: file.filename,
      originalName: file.originalName,
      filePath: file.filePath,
      fileSize: file.fileSize,
      mimeType: file.mimeType,
      status: file.status,
      metadata: file.metadata,
      description: file.description,
      createdAt: file.createdAt.toISOString(),
      updatedAt: file.updatedAt.toISOString(),
      userId: file.userId,
      // Generate preview URL for images and other previewable types
      previewUrl: this.isPreviewable(file.mimeType)
        ? `${baseUrl}/api/v1/files/${file.id}/render`
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
