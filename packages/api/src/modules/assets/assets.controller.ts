import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
  Res,
  Req,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FastifyReply, FastifyRequest } from 'fastify';
import { AssetsService } from './assets.service';
import { UploadAssetDto, AssetResponseDto, AssetEntityType } from './dto';
import { FileUploadResult } from './dto/fastify-file.interface';
import { Allow } from '../../common/decorators/allow.decorator';
import { AppCtxt } from '../../common/decorators/request-context.decorator';
import { IRequestContext } from '@gymspace/shared';
import { PERMISSIONS } from '@gymspace/shared';
import { parseMultipartUpload, parseUploadDto } from './utils/multipart.util';

@ApiTags('Assets')
@ApiBearerAuth()
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post('upload')
  @Allow(PERMISSIONS.ASSETS_CREATE)
  @ApiOperation({ summary: 'Upload a new asset' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        entityType: {
          type: 'string',
          enum: Object.values(AssetEntityType),
        },
        entityId: {
          type: 'string',
          format: 'uuid',
        },
        description: {
          type: 'string',
        },
        metadata: {
          type: 'object',
        },
      },
      required: ['file', 'entityType', 'entityId'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Asset uploaded successfully',
    type: AssetResponseDto,
  })
  async upload(@Req() request: FastifyRequest, @AppCtxt() context: IRequestContext) {
    try {
      // Parse multipart upload
      const { file, fields } = await parseMultipartUpload(request);

      // Parse and validate DTO
      const dto = parseUploadDto<UploadAssetDto>(fields);

      // Validate required fields
      if (!dto.entityType || !dto.entityId) {
        throw new BadRequestException('entityType and entityId are required');
      }

      return this.assetsService.upload(context, file, dto);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to process upload');
    }
  }

  @Get(':id')
  @Allow(PERMISSIONS.ASSETS_READ)
  @ApiOperation({ summary: 'Get asset by ID' })
  @ApiResponse({
    status: 200,
    description: 'Asset details',
    type: AssetResponseDto,
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @AppCtxt() context: IRequestContext) {
    return this.assetsService.findOne(context, id);
  }

  @Get(':id/download-url')
  @Allow(PERMISSIONS.ASSETS_READ)
  @ApiOperation({ summary: 'Get signed download URL for an asset' })
  @ApiResponse({
    status: 200,
    description: 'Download URL',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        filename: { type: 'string' },
      },
    },
  })
  async getDownloadUrl(
    @Param('id', ParseUUIDPipe) id: string,
    @AppCtxt() context: IRequestContext,
  ) {
    return this.assetsService.getDownloadUrl(context, id);
  }

  @Get(':id/download')
  @Allow(PERMISSIONS.ASSETS_READ)
  @ApiOperation({ summary: 'Download asset file' })
  @ApiResponse({
    status: 200,
    description: 'File stream',
  })
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @AppCtxt() context: IRequestContext,
    @Res() res: FastifyReply,
  ) {
    const { stream, filename, mimeType, fileSize } = await this.assetsService.download(context, id);

    res.headers({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': fileSize.toString(),
    });

    return res.send(stream);
  }

  @Delete(':id')
  @Allow(PERMISSIONS.ASSETS_DELETE)
  @ApiOperation({ summary: 'Soft delete an asset' })
  @ApiResponse({
    status: 200,
    description: 'Asset deleted successfully',
  })
  async delete(@Param('id', ParseUUIDPipe) id: string, @AppCtxt() context: IRequestContext) {
    return this.assetsService.delete(context, id);
  }

  @Get(':id/render')
  @Allow(PERMISSIONS.ASSETS_READ)
  @ApiOperation({ summary: 'Render/serve asset file directly (for preview)' })
  @ApiResponse({
    status: 200,
    description: 'File stream for rendering',
  })
  async render(
    @Param('id', ParseUUIDPipe) id: string,
    @AppCtxt() context: IRequestContext,
    @Res() res: FastifyReply,
  ) {
    const { stream, filename, mimeType, fileSize } = await this.assetsService.serve(context, id);

    // Set appropriate headers for rendering in browser
    const contentDisposition = this.getContentDisposition(mimeType, filename);
    
    res.headers({
      'Content-Type': mimeType,
      'Content-Disposition': contentDisposition,
      'Content-Length': fileSize.toString(),
      'Cache-Control': 'public, max-age=86400', // Cache for 1 day
    });

    return res.send(stream);
  }

  @Get('entity/:entityType/:entityId')
  @Allow(PERMISSIONS.ASSETS_READ)
  @ApiOperation({ summary: 'List assets for a specific entity' })
  @ApiResponse({
    status: 200,
    description: 'List of assets',
    type: [AssetResponseDto],
  })
  async findByEntity(
    @Param('entityType') entityType: AssetEntityType,
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @AppCtxt() context: IRequestContext,
  ) {
    return this.assetsService.findByEntity(context, entityType, entityId);
  }

  /**
   * Get appropriate Content-Disposition header based on mime type
   */
  private getContentDisposition(mimeType: string, filename: string): string {
    // Images, PDFs, and videos should be displayed inline
    const inlineTypes = [
      'image/',
      'application/pdf',
      'video/',
      'text/plain',
      'text/html',
    ];

    const shouldInline = inlineTypes.some(type => mimeType.startsWith(type));
    
    return shouldInline 
      ? `inline; filename="${filename}"`
      : `attachment; filename="${filename}"`;
  }
}
