import { Readable } from 'stream';

export interface FastifyFile {
  filename: string;
  mimetype: string;
  encoding: string;
  file: Readable;
}

export interface FileUploadResult {
  filename: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}
