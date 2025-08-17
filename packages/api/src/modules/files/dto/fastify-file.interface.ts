export interface FileUploadResult {
  filename: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}
