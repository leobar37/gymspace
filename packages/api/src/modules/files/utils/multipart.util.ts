import { FastifyRequest } from 'fastify';
import { BadRequestException } from '@nestjs/common';
import { FileUploadResult } from '../dto/fastify-file.interface';

export interface MultipartFields {
  [key: string]: any;
}

export interface MultipartParseResult {
  file: FileUploadResult;
  fields: MultipartFields;
}

export async function parseMultipartUpload(
  request: FastifyRequest,
  maxFileSize: number = 10 * 1024 * 1024, // 10MB default
): Promise<MultipartParseResult> {
  const parts = (request as any).parts();
  const fields: MultipartFields = {};
  let fileData: FileUploadResult | null = null;

  for await (const part of parts) {
    if (part.type === 'field') {
      // Handle regular fields
      fields[part.fieldname] = part.value;
    } else if (part.type === 'file') {
      // Handle file upload
      if (part.fieldname !== 'file') {
        continue; // Skip files that aren't in the 'file' field
      }

      const chunks: Buffer[] = [];
      let totalSize = 0;

      for await (const chunk of part.file) {
        totalSize += chunk.length;

        if (totalSize > maxFileSize) {
          throw new BadRequestException(
            `File size exceeds maximum allowed size of ${maxFileSize} bytes`,
          );
        }

        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);

      fileData = {
        filename: part.filename,
        mimetype: part.mimetype,
        size: buffer.length,
        buffer,
      };
    }
  }

  if (!fileData) {
    throw new BadRequestException('No file found in request');
  }

  return { file: fileData, fields };
}

export function parseUploadDto<T>(fields: MultipartFields): T {
  const dto: any = {};

  for (const [key, value] of Object.entries(fields)) {
    // Try to parse JSON fields
    if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
      try {
        dto[key] = JSON.parse(value);
      } catch {
        dto[key] = value;
      }
    } else {
      dto[key] = value;
    }
  }

  return dto as T;
}
