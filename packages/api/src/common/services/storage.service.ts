import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Readable } from 'stream';

@Injectable()
export class StorageService implements OnModuleInit {
  private supabase: SupabaseClient;
  private bucket: string = 'gymspace-assets'; // Fixed bucket name for assets

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get('supabase.url');
    const supabaseKey = this.configService.get('supabase.serviceKey');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'Supabase configuration is missing. Please check SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.',
      );
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  async onModuleInit() {
    // Ensure the storage bucket exists
    await this.ensureBucketExists();
  }

  private async ensureBucketExists(): Promise<void> {
    try {
      // Check if bucket exists by trying to list objects (limited to 1)
      const { error } = await this.supabase.storage
        .from(this.bucket)
        .list('', { limit: 1 });

      if (error && error.message.includes('not found')) {
        console.log(`Creating bucket "${this.bucket}"...`);
        const { error: createError } = await this.supabase.storage.createBucket(this.bucket, {
          public: false,
          allowedMimeTypes: ['*/*'],
        });

        if (createError && !createError.message.includes('already exists')) {
          console.error(`Error creating bucket "${this.bucket}":`, createError);
          throw createError;
        }
        
        console.log(`Bucket "${this.bucket}" created successfully`);
      } else if (error) {
        console.error(`Error checking bucket "${this.bucket}":`, error);
        throw error;
      } else {
        console.log(`Bucket "${this.bucket}" already exists`);
      }
    } catch (error: any) {
      console.error(`Unexpected error with bucket "${this.bucket}":`, error);
      throw error;
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

      const { data: uploadData, error } = await this.supabase.storage
        .from(this.bucket)
        .upload(key, data, {
          contentType: options?.contentType || 'application/octet-stream',
          metadata: sanitizedMetadata,
          upsert: true, // Allow overwriting existing files
        });

      if (error) {
        console.error('Upload failed:', {
          key,
          bucket: this.bucket,
          error: error.message,
          errorName: error.name,
        });
        throw error;
      }

      // Get the public URL or signed URL for the uploaded file
      const { data: urlData } = this.supabase.storage
        .from(this.bucket)
        .getPublicUrl(key);

      // Return a response similar to S3 SDK for compatibility
      return {
        Location: urlData.publicUrl,
        ETag: uploadData.id || '', // Use the ID as ETag equivalent
        Key: key,
        Bucket: this.bucket,
      };
    } catch (error: any) {
      console.error('Upload failed:', {
        key,
        bucket: this.bucket,
        error: error.message,
      });
      throw error;
    }
  }

  async download(key: string): Promise<Readable> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucket)
        .download(key);

      if (error) {
        console.error('Error downloading from Supabase Storage:', {
          bucket: this.bucket,
          key,
          error: error.message,
          name: error.name,
        });
        
        // Re-throw with more context
        if (error.message.includes('not found') || error.message.includes('does not exist')) {
          throw new Error(`File not found in storage: ${key}`);
        }
        
        throw error;
      }

      if (!data) {
        throw new Error(`File not found in storage: ${key}`);
      }

      // Convert Blob to Buffer and then to Readable stream
      const buffer = Buffer.from(await data.arrayBuffer());
      return Readable.from(buffer);
    } catch (error: any) {
      console.error('Error downloading from Supabase Storage:', {
        bucket: this.bucket,
        key,
        error: error.message,
      });
      
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const { error } = await this.supabase.storage
        .from(this.bucket)
        .remove([key]);

      if (error) {
        // Supabase doesn't return an error when deleting a non-existent object,
        // but we'll handle it gracefully if it does
        if (error.message.includes('not found') || error.message.includes('does not exist')) {
          console.log(`Object ${key} not found, considering it already deleted`);
          return;
        }
        throw error;
      }
    } catch (error: any) {
      console.error('Error deleting from Supabase Storage:', {
        bucket: this.bucket,
        key,
        error: error.message,
      });
      throw error;
    }
  }

  async getSignedUrl(key: string, operation: 'download' | 'upload'): Promise<string> {
    try {
      if (operation === 'download') {
        // Generate signed URL for download with 1 hour expiration
        const { data, error } = await this.supabase.storage
          .from(this.bucket)
          .createSignedUrl(key, 3600); // 1 hour in seconds

        if (error) {
          throw error;
        }

        return data.signedUrl;
      } else {
        // For upload operations, return a signed upload URL
        const { data, error } = await this.supabase.storage
          .from(this.bucket)
          .createSignedUploadUrl(key);

        if (error) {
          throw error;
        }

        return data.signedUrl;
      }
    } catch (error: any) {
      console.error('Error creating signed URL:', {
        bucket: this.bucket,
        key,
        operation,
        error: error.message,
      });
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      // Parse the path to get directory and filename
      const pathParts = key.split('/');
      const fileName = pathParts.pop(); // Get the filename
      const prefix = pathParts.length > 0 ? pathParts.join('/') + '/' : ''; // Get directory prefix
      
      // List files in the specific directory
      const { data, error } = await this.supabase.storage
        .from(this.bucket)
        .list(prefix || undefined, {
          limit: 1000,
          search: fileName,
        });

      if (error) {
        if (error.message.includes('not found') || error.message.includes('does not exist')) {
          return false;
        }
        throw error;
      }

      // Check if the exact filename exists in the results
      return data.some(file => file.name === fileName);
    } catch (error: any) {
      // Fallback: try to download a small portion to check existence
      try {
        const { error: downloadError } = await this.supabase.storage
          .from(this.bucket)
          .download(key, {
            transform: {
              width: 1,
              height: 1,
            },
          });
        
        return !downloadError;
      } catch (fallbackError: any) {
        console.error('Error checking file existence:', {
          bucket: this.bucket,
          key,
          error: error.message,
          fallbackError: fallbackError.message,
        });
        return false; // Assume file doesn't exist if we can't check
      }
    }
  }
}