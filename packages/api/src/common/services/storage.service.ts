import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommandInput,
  GetObjectCommandInput,
  DeleteObjectCommandInput,
  HeadObjectCommandInput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

@Injectable()
export class StorageService implements OnModuleInit {
  private s3Client: S3Client;
  private bucket: string = 'assets'; // Fixed bucket name for assets

  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      endpoint: this.configService.get('s3.endpoint'),
      region: this.configService.get('s3.region') || 'us-east-1',
      credentials: {
        accessKeyId: this.configService.get('s3.accessKey'),
        secretAccessKey: this.configService.get('s3.secretKey'),
      },
      forcePathStyle: true, // Required for MinIO
    });
  }

  async onModuleInit() {
    // Ensure the assets bucket exists
    await this.ensureBucketExists();
  }

  private async ensureBucketExists(): Promise<void> {
    try {
      const command = new HeadBucketCommand({ Bucket: this.bucket });
      await this.s3Client.send(command);
      console.log(`Bucket "${this.bucket}" already exists`);
    } catch (error: any) {
      if (
        error.name === 'NotFound' ||
        error.name === 'NoSuchBucket' ||
        error.$metadata?.httpStatusCode === 404
      ) {
        try {
          console.log(`Creating bucket "${this.bucket}"...`);
          const createCommand = new CreateBucketCommand({ Bucket: this.bucket });
          await this.s3Client.send(createCommand);
          console.log(`Bucket "${this.bucket}" created successfully`);
        } catch (createError: any) {
          // Bucket might already exist (race condition) or creation failed
          if (
            createError.name === 'BucketAlreadyExists' ||
            createError.name === 'BucketAlreadyOwnedByYou'
          ) {
            console.log(`Bucket "${this.bucket}" already exists (race condition)`);
          } else {
            console.error(`Error creating bucket "${this.bucket}":`, createError);
            throw createError;
          }
        }
      } else {
        console.error(`Error checking bucket "${this.bucket}":`, error);
        throw error;
      }
    }
  }

  async upload(
    key: string,
    data: Buffer,
    options?: {
      contentType?: string;
      metadata?: Record<string, string>;
    },
  ): Promise<{ Location: string; ETag: string; Key: string; Bucket: string }> {
    try {
      // Ensure all metadata values are strings
      const sanitizedMetadata: Record<string, string> = {};
      if (options?.metadata) {
        Object.entries(options.metadata).forEach(([key, value]) => {
          // Convert any non-string values to strings
          sanitizedMetadata[key] = String(value || '');
        });
      }

      const params: PutObjectCommandInput = {
        Bucket: this.bucket,
        Key: key,
        Body: data,
        ContentType: options?.contentType || 'application/octet-stream',
        Metadata: sanitizedMetadata,
      };

      const command = new PutObjectCommand(params);
      const result = await this.s3Client.send(command);

      // Return a response similar to the old SDK for compatibility
      const endpoint = this.configService.get('s3.endpoint');
      return {
        Location: `${endpoint}/${this.bucket}/${key}`,
        ETag: result.ETag || '',
        Key: key,
        Bucket: this.bucket,
      };
    } catch (error: any) {
      console.error('Upload failed:', {
        key,
        bucket: this.bucket,
        error: error.message,
        errorName: error.name,
        metadata: error.$metadata,
      });
      throw error;
    }
  }

  async download(key: string): Promise<Readable> {
    const params: GetObjectCommandInput = {
      Bucket: this.bucket,
      Key: key,
    };

    const command = new GetObjectCommand(params);
    const response = await this.s3Client.send(command);

    // The Body in SDK v3 is already a readable stream
    if (response.Body instanceof Readable) {
      return response.Body;
    }

    // For environments where Body might be a web stream or buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }
    return Readable.from(Buffer.concat(chunks));
  }

  async delete(key: string): Promise<void> {
    try {
      const params: DeleteObjectCommandInput = {
        Bucket: this.bucket,
        Key: key,
      };

      const command = new DeleteObjectCommand(params);
      await this.s3Client.send(command);
    } catch (error: any) {
      // S3/MinIO doesn't return an error when deleting a non-existent object in some configurations,
      // but we'll handle it gracefully if it does
      if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
        // Object doesn't exist, which is fine for delete operations
        console.log(`Object ${key} not found, considering it already deleted`);
        return;
      }
      throw error;
    }
  }

  async getSignedUrl(key: string, operation: 'download' | 'upload'): Promise<string> {
    const params = {
      Bucket: this.bucket,
      Key: key,
    };

    const command =
      operation === 'download' ? new GetObjectCommand(params) : new PutObjectCommand(params);

    // Generate presigned URL with 1 hour expiration
    return getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }

  async exists(key: string): Promise<boolean> {
    try {
      const params: HeadObjectCommandInput = {
        Bucket: this.bucket,
        Key: key,
      };
      const command = new HeadObjectCommand(params);
      await this.s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }
}
