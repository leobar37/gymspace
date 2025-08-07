import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { Readable } from 'stream';

@Injectable()
export class StorageService {
  private s3: AWS.S3;
  private bucket: string;

  constructor(private readonly configService: ConfigService) {
    this.s3 = new AWS.S3({
      endpoint: this.configService.get('storage.endpoint'),
      accessKeyId: this.configService.get('storage.accessKey'),
      secretAccessKey: this.configService.get('storage.secretKey'),
      s3ForcePathStyle: true, // Required for MinIO
      signatureVersion: 'v4',
    });

    this.bucket = this.configService.get('storage.bucket');
  }

  async upload(
    key: string,
    data: Buffer,
    options?: {
      contentType?: string;
      metadata?: Record<string, string>;
    },
  ): Promise<AWS.S3.ManagedUpload.SendData> {
    const params: AWS.S3.PutObjectRequest = {
      Bucket: this.bucket,
      Key: key,
      Body: data,
      ContentType: options?.contentType || 'application/octet-stream',
      Metadata: options?.metadata || {},
    };

    return this.s3.upload(params).promise();
  }

  async download(key: string): Promise<Readable> {
    const params: AWS.S3.GetObjectRequest = {
      Bucket: this.bucket,
      Key: key,
    };

    const object = await this.s3.getObject(params).promise();
    return Readable.from(Buffer.from(object.Body as any));
  }

  async delete(key: string): Promise<void> {
    const params: AWS.S3.DeleteObjectRequest = {
      Bucket: this.bucket,
      Key: key,
    };

    await this.s3.deleteObject(params).promise();
  }

  async getSignedUrl(key: string, operation: 'download' | 'upload'): Promise<string> {
    const params = {
      Bucket: this.bucket,
      Key: key,
      Expires: 3600, // 1 hour
    };

    const s3Operation = operation === 'download' ? 'getObject' : 'putObject';
    return this.s3.getSignedUrlPromise(s3Operation, params);
  }

  async exists(key: string): Promise<boolean> {
    try {
      const params: AWS.S3.HeadObjectRequest = {
        Bucket: this.bucket,
        Key: key,
      };
      await this.s3.headObject(params).promise();
      return true;
    } catch (error) {
      if (error.code === 'NotFound') {
        return false;
      }
      throw error;
    }
  }
}