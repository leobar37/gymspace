import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  ListBucketsCommand,
} from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { Readable } from 'stream';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

// Get S3 configuration from environment
const s3Config = {
  endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  accessKey: process.env.S3_ACCESS_KEY || 'gymspace',
  secretKey: process.env.S3_SECRET_KEY || 'gymspace123',
  region: process.env.S3_REGION || 'us-east-1',
  bucket: process.env.S3_BUCKET || 'assets',
};

console.log('S3 Configuration:');
console.log('  Endpoint:', s3Config.endpoint);
console.log('  Access Key:', s3Config.accessKey);
console.log('  Region:', s3Config.region);
console.log('  Bucket:', s3Config.bucket);
console.log('');

// Create S3 client
const s3Client = new S3Client({
  endpoint: s3Config.endpoint,
  region: s3Config.region,
  credentials: {
    accessKeyId: s3Config.accessKey,
    secretAccessKey: s3Config.secretKey,
  },
  forcePathStyle: true, // Required for MinIO
});

// Test functions
async function testListBuckets() {
  console.log('\n=== Testing List Buckets ===');
  try {
    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);
    
    console.log('✅ List buckets successful');
    console.log(`Total buckets: ${response.Buckets?.length || 0}`);
    response.Buckets?.forEach((bucket) => {
      console.log(`  - ${bucket.Name} (Created: ${bucket.CreationDate})`);
    });
    
    return true;
  } catch (error: any) {
    console.error('❌ List buckets failed:', error.message);
    console.error('Error details:', {
      name: error.name,
      code: error.Code,
      statusCode: error.$metadata?.httpStatusCode,
    });
    return false;
  }
}

async function testBucketExists(bucketName: string) {
  console.log(`\n=== Testing Bucket Exists: ${bucketName} ===`);
  try {
    const command = new HeadBucketCommand({ Bucket: bucketName });
    await s3Client.send(command);
    console.log(`✅ Bucket "${bucketName}" exists`);
    return true;
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      console.log(`❌ Bucket "${bucketName}" does not exist`);
    } else {
      console.error(`❌ Error checking bucket:`, error.message);
      console.error('Error details:', {
        name: error.name,
        code: error.Code,
        statusCode: error.$metadata?.httpStatusCode,
      });
    }
    return false;
  }
}

async function testCreateBucket(bucketName: string) {
  console.log(`\n=== Testing Create Bucket: ${bucketName} ===`);
  try {
    const command = new CreateBucketCommand({ Bucket: bucketName });
    await s3Client.send(command);
    console.log(`✅ Bucket "${bucketName}" created successfully`);
    return true;
  } catch (error: any) {
    if (error.name === 'BucketAlreadyExists' || error.name === 'BucketAlreadyOwnedByYou') {
      console.log(`⚠️ Bucket "${bucketName}" already exists`);
      return true;
    }
    console.error('❌ Create bucket failed:', error.message);
    console.error('Error details:', {
      name: error.name,
      code: error.Code,
      statusCode: error.$metadata?.httpStatusCode,
    });
    return false;
  }
}

async function testUploadObject(bucketName: string, key: string, content: string) {
  console.log(`\n=== Testing Upload Object: ${key} ===`);
  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: Buffer.from(content),
      ContentType: 'text/plain',
    });
    
    const response = await s3Client.send(command);
    console.log(`✅ Object uploaded successfully`);
    console.log('  ETag:', response.ETag);
    console.log('  Version ID:', response.VersionId || 'N/A');
    return true;
  } catch (error: any) {
    console.error('❌ Upload failed:', error.message);
    console.error('Error details:', {
      name: error.name,
      code: error.Code,
      statusCode: error.$metadata?.httpStatusCode,
    });
    return false;
  }
}

async function testDownloadObject(bucketName: string, key: string) {
  console.log(`\n=== Testing Download Object: ${key} ===`);
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    
    const response = await s3Client.send(command);
    
    if (response.Body) {
      // Convert stream to string for testing
      const chunks: Uint8Array[] = [];
      if (response.Body instanceof Readable) {
        for await (const chunk of response.Body) {
          chunks.push(chunk);
        }
      } else {
        // Handle web streams or other formats
        const reader = (response.Body as any).getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }
      }
      
      const content = Buffer.concat(chunks).toString('utf-8');
      console.log(`✅ Object downloaded successfully`);
      console.log('  Content Type:', response.ContentType);
      console.log('  Content Length:', response.ContentLength);
      console.log('  Content Preview:', content.substring(0, 100));
      console.log('  ETag:', response.ETag);
      return true;
    }
    
    console.log('⚠️ No content in response');
    return false;
  } catch (error: any) {
    if (error.name === 'NoSuchKey' || error.Code === 'NoSuchKey') {
      console.error(`❌ Object not found: ${key}`);
    } else {
      console.error('❌ Download failed:', error.message);
    }
    console.error('Error details:', {
      name: error.name,
      code: error.Code,
      statusCode: error.$metadata?.httpStatusCode,
      response: error.$response,
    });
    
    // Check if there's a hidden response field with more details
    if (error.$response) {
      console.error('Response details:', {
        statusCode: error.$response.statusCode,
        headers: error.$response.headers,
        body: error.$response.body,
      });
    }
    return false;
  }
}

async function testListObjects(bucketName: string) {
  console.log(`\n=== Testing List Objects in Bucket: ${bucketName} ===`);
  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 10,
    });
    
    const response = await s3Client.send(command);
    console.log(`✅ List objects successful`);
    console.log(`  Total objects: ${response.KeyCount || 0}`);
    
    if (response.Contents && response.Contents.length > 0) {
      response.Contents.forEach((obj) => {
        console.log(`  - ${obj.Key} (Size: ${obj.Size} bytes, Modified: ${obj.LastModified})`);
      });
    } else {
      console.log('  No objects in bucket');
    }
    
    return true;
  } catch (error: any) {
    console.error('❌ List objects failed:', error.message);
    console.error('Error details:', {
      name: error.name,
      code: error.Code,
      statusCode: error.$metadata?.httpStatusCode,
    });
    return false;
  }
}

async function testDeleteObject(bucketName: string, key: string) {
  console.log(`\n=== Testing Delete Object: ${key} ===`);
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    
    await s3Client.send(command);
    console.log(`✅ Object deleted successfully`);
    return true;
  } catch (error: any) {
    console.error('❌ Delete failed:', error.message);
    console.error('Error details:', {
      name: error.name,
      code: error.Code,
      statusCode: error.$metadata?.httpStatusCode,
    });
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('Starting S3 connectivity tests...');
  console.log('================================\n');
  
  const testBucket = s3Config.bucket;
  const testKey = 'test-file.txt';
  const testContent = 'This is a test file content for S3 connectivity testing.\nCreated at: ' + new Date().toISOString();
  
  try {
    // 1. Test listing buckets (basic connectivity test)
    console.log('Step 1: Testing basic S3 connectivity...');
    const canConnect = await testListBuckets();
    
    if (!canConnect) {
      console.error('\n❌ Cannot connect to S3. Please check:');
      console.error('  1. S3/MinIO is running (docker-compose up)');
      console.error('  2. Endpoint is correct:', s3Config.endpoint);
      console.error('  3. Credentials are valid');
      return;
    }
    
    // 2. Check if bucket exists
    console.log('\nStep 2: Checking target bucket...');
    let bucketExists = await testBucketExists(testBucket);
    
    // 3. Create bucket if it doesn't exist
    if (!bucketExists) {
      console.log('\nStep 3: Creating bucket...');
      bucketExists = await testCreateBucket(testBucket);
      
      if (!bucketExists) {
        console.error('\n❌ Cannot create bucket. Cannot continue tests.');
        return;
      }
    }
    
    // 4. Upload a test object
    console.log('\nStep 4: Testing file upload...');
    const uploaded = await testUploadObject(testBucket, testKey, testContent);
    
    if (!uploaded) {
      console.error('\n❌ Upload failed. Cannot continue tests.');
      return;
    }
    
    // 5. List objects in bucket
    console.log('\nStep 5: Listing bucket contents...');
    await testListObjects(testBucket);
    
    // 6. Download the test object
    console.log('\nStep 6: Testing file download...');
    await testDownloadObject(testBucket, testKey);
    
    // 7. Test downloading non-existent object (error handling)
    console.log('\nStep 7: Testing error handling (non-existent file)...');
    await testDownloadObject(testBucket, 'non-existent-file.txt');
    
    // 8. Delete the test object
    console.log('\nStep 8: Cleaning up test file...');
    await testDeleteObject(testBucket, testKey);
    
    // 9. Final verification
    console.log('\nStep 9: Final verification...');
    await testListObjects(testBucket);
    
  } catch (error) {
    console.error('\n❌ Test suite failed with unexpected error:', error);
  }
  
  console.log('\n================================');
  console.log('S3 connectivity tests complete!');
  console.log('================================\n');
  
  // Summary
  console.log('Summary:');
  console.log('  Endpoint:', s3Config.endpoint);
  console.log('  Bucket:', testBucket);
  console.log('  Test file:', testKey);
  console.log('\nIf all tests passed, your S3 configuration is working correctly! ✅');
  console.log('If you see XML parsing errors, check that MinIO/S3 is running and accessible.');
}

// Run the tests
runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});