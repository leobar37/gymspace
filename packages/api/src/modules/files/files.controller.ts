import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  ParseUUIDPipe,
  Res,
  Req,
  BadRequestException,
  Query,
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
import { FilesService } from './files.service';
import { UploadFileDto, FileResponseDto } from './dto';
import { Allow } from '../../common/decorators/allow.decorator';
import { AppCtxt } from '../../common/decorators/request-context.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { IRequestContext } from '@gymspace/shared';
import { PERMISSIONS } from '@gymspace/shared';
import { parseMultipartUpload, parseUploadDto } from './utils/multipart.util';

@ApiTags('Files')
@ApiBearerAuth()
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @Allow(PERMISSIONS.FILES_CREATE)
  @ApiOperation({ summary: 'Upload a new file with unique identifier generation' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'The file to upload',
        },
        description: {
          type: 'string',
          description: 'Optional description for the file',
        },
        metadata: {
          type: 'object',
          description: 'Optional metadata for the file',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    type: FileResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid file or parameters',
  })
  @ApiResponse({
    status: 413,
    description: 'File too large',
  })
  async upload(@Req() request: FastifyRequest, @AppCtxt() context: IRequestContext) {
    try {
      // Parse multipart upload
      const { file, fields } = await parseMultipartUpload(request);

      // Parse and validate DTO
      const dto = parseUploadDto<UploadFileDto>(fields);

      return this.filesService.upload(context, file, dto);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to process upload');
    }
  }

  @Get()
  @Allow(PERMISSIONS.FILES_READ)
  @ApiOperation({ summary: 'Get all files for the current user' })
  @ApiResponse({
    status: 200,
    description: 'List of user files',
    type: [FileResponseDto],
  })
  async findAll(@AppCtxt() context: IRequestContext) {
    return this.filesService.findAll(context);
  }

  @Get(':id')
  @Allow(PERMISSIONS.FILES_READ)
  @ApiOperation({ summary: 'Get file by ID' })
  @ApiResponse({
    status: 200,
    description: 'File details',
    type: FileResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'File not found',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @AppCtxt() context: IRequestContext) {
    return this.filesService.findOne(context, id);
  }

  @Get('by-ids')
  @Allow(PERMISSIONS.FILES_READ)
  @ApiOperation({ summary: 'Get multiple files by IDs' })
  @ApiResponse({
    status: 200,
    description: 'List of files',
    type: [FileResponseDto],
  })
  async findByIds(@Query('ids') ids: string | string[], @AppCtxt() context: IRequestContext) {
    // Return empty array if no IDs provided
    if (!ids) {
      return [];
    }

    // Handle both single ID and array of IDs
    const fileIds = Array.isArray(ids) ? ids : ids.split(',').filter((id) => id.trim());

    // Return empty array if no valid IDs after filtering
    if (fileIds.length === 0) {
      return [];
    }

    return this.filesService.findByIds(context, fileIds);
  }

  @Get(':id/download')
  @Allow(PERMISSIONS.FILES_READ)
  @ApiOperation({ summary: 'Download file' })
  @ApiResponse({
    status: 200,
    description: 'File stream',
  })
  @ApiResponse({
    status: 404,
    description: 'File not found',
  })
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @AppCtxt() context: IRequestContext,
    @Res() res: FastifyReply,
  ) {
    const { stream, filename, mimeType, fileSize } = await this.filesService.download(context, id);

    res.headers({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': fileSize.toString(),
    });

    return res.send(stream);
  }

  @Delete(':id')
  @Allow(PERMISSIONS.FILES_DELETE)
  @ApiOperation({ summary: 'Soft delete a file' })
  @ApiResponse({
    status: 200,
    description: 'File deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'File not found',
  })
  async delete(@Param('id', ParseUUIDPipe) id: string, @AppCtxt() context: IRequestContext) {
    await this.filesService.delete(context, id);
    return { message: 'File deleted successfully' };
  }

  @Get(':id/render')
  @Public()
  @ApiOperation({ summary: 'Render/serve file directly (for preview)' })
  @ApiResponse({
    status: 200,
    description: 'File stream for rendering',
  })
  @ApiResponse({
    status: 404,
    description: 'File not found',
  })
  async render(@Param('id', ParseUUIDPipe) id: string, @Res() res: FastifyReply) {
    // Create a minimal context for public rendering
    const context = { getUserId: () => 'public' } as IRequestContext;

    const { stream, filename, mimeType, fileSize } = await this.filesService.serve(context, id);

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

  /**
   * Get appropriate Content-Disposition header based on mime type
   */
  private getContentDisposition(mimeType: string, filename: string): string {
    // Images, PDFs, and videos should be displayed inline
    const inlineTypes = ['image/', 'application/pdf', 'video/', 'text/plain', 'text/html'];

    const shouldInline = inlineTypes.some((type) => mimeType.startsWith(type));

    return shouldInline ? `inline; filename="${filename}"` : `attachment; filename="${filename}"`;
  }
}