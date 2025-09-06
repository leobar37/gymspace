import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

// Get Supabase configuration from environment
const supabaseConfig = {
  url: process.env.SUPABASE_URL || '',
  serviceKey: process.env.SUPABASE_SERVICE_KEY || '',
  bucket: 'gymspace-assets',
};

console.log('Supabase Storage Configuration:');
console.log('  URL:', supabaseConfig.url);
console.log(
  '  Service Key:',
  supabaseConfig.serviceKey ? '***' + supabaseConfig.serviceKey.slice(-8) : 'Not set',
);
console.log('  Bucket:', supabaseConfig.bucket);
console.log('');

// Create Supabase client
const supabase: SupabaseClient = createClient(supabaseConfig.url, supabaseConfig.serviceKey, {
  auth: {
    persistSession: false,
  },
});

// Test functions
async function testListBuckets() {
  console.log('\n=== Testing List Buckets ===');
  try {
    const { data, error } = await supabase.storage.listBuckets();

    if (error) {
      throw error;
    }

    console.log('✅ List buckets successful');
    console.log(`Total buckets: ${data?.length || 0}`);
    data?.forEach((bucket) => {
      console.log(`  - ${bucket.name} (Created: ${bucket.created_at})`);
    });

    return true;
  } catch (error: any) {
    console.error('❌ List buckets failed:', error.message);
    console.error('Error details:', error);
    return false;
  }
}

async function testBucketExists(bucketName: string) {
  console.log(`\n=== Testing Bucket Exists: ${bucketName} ===`);
  try {
    const { data, error } = await supabase.storage.getBucket(bucketName);

    if (error) {
      if (error.message?.includes('not found')) {
        console.log(`❌ Bucket "${bucketName}" does not exist`);
      } else {
        console.error(`❌ Error checking bucket:`, error.message);
        console.error('Error details:', error);
      }
      return false;
    }

    console.log(`✅ Bucket "${bucketName}" exists`);
    console.log(`  Public: ${data.public}`);
    console.log(`  File size limit: ${data.file_size_limit || 'No limit'}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Error checking bucket:`, error.message);
    console.error('Error details:', error);
    return false;
  }
}

async function testCreateBucket(bucketName: string) {
  console.log(`\n=== Testing Create Bucket: ${bucketName} ===`);
  try {
    // First, try to delete the bucket if it exists (to recreate with proper config)
    await supabase.storage.deleteBucket(bucketName);

    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: false,
      // Remove restrictions that might cause issues
      // fileSizeLimit: 52428800, // 50MB
      // allowedMimeTypes: ['image/*', 'application/pdf', 'text/*'],
    });

    if (error) {
      if (error.message?.includes('already exists')) {
        console.log(`⚠️ Bucket "${bucketName}" already exists`);
        return true;
      }
      throw error;
    }

    console.log(`✅ Bucket "${bucketName}" created successfully`);
    console.log('  Bucket ID:', data.name);
    return true;
  } catch (error: any) {
    console.error('❌ Create bucket failed:', error.message);
    console.error('Error details:', error);
    return false;
  }
}

async function testUploadObject(bucketName: string, key: string, content: string) {
  console.log(`\n=== Testing Upload Object: ${key} ===`);
  try {
    // Try different upload methods
    console.log('  Attempting upload with text content...');
    const { data, error } = await supabase.storage.from(bucketName).upload(key, content, {
      contentType: 'text/plain',
      upsert: true,
    });

    // 52428800
    if (error) {
      console.log('  String upload failed, trying with Blob...');
      // Try with Blob instead
      const blob = new Blob([content], { type: 'text/plain' });
      const { data: blobData, error: blobError } = await supabase.storage
        .from(bucketName)
        .upload(key, blob, {
          contentType: 'text/plain',
          upsert: true,
        });

      if (blobError) {
        throw blobError;
      }

      console.log(`✅ Object uploaded successfully (using Blob)`);
      console.log('  Path:', blobData.path);
      return true;
    }

    console.log(`✅ Object uploaded successfully`);
    console.log('  Path:', data.path);
    console.log('  ID:', data.id);
    console.log('  Full Path:', data.fullPath);
    return true;
  } catch (error: any) {
    console.error('❌ Upload failed:', error.message);
    console.error('Error details:', error);
    if (error.status) {
      console.error('  Status:', error.status);
      console.error('  Status Code:', error.statusCode);
    }
    return false;
  }
}

async function testDownloadObject(bucketName: string, key: string) {
  console.log(`\n=== Testing Download Object: ${key} ===`);
  try {
    const { data, error } = await supabase.storage.from(bucketName).download(key);

    if (error) {
      if (error.message?.includes('not found') || error.originalError?.status === 400) {
        console.log(`✅ Error handling working: Object not found (${key}) - Expected behavior`);
      } else {
        console.error('❌ Download failed:', error.message);
        console.error('Error details:', error);
      }
      return false;
    }

    if (data) {
      // Convert Blob to string for testing
      const content = await data.text();
      console.log(`✅ Object downloaded successfully`);
      console.log('  Content Type:', data.type);
      console.log('  Content Length:', data.size);
      console.log('  Content Preview:', content.substring(0, 100));
      return true;
    }

    console.log('⚠️ No content in response');
    return false;
  } catch (error: any) {
    console.error('❌ Download failed:', error.message);
    console.error('Error details:', error);
    return false;
  }
}

async function testGetSignedUrl(bucketName: string, key: string) {
  console.log(`\n=== Testing Get Signed URL: ${key} ===`);
  try {
    const { data, error } = await supabase.storage.from(bucketName).createSignedUrl(key, 3600); // 1 hour expiration

    if (error) {
      throw error;
    }

    console.log(`✅ Signed URL created successfully`);
    console.log('  URL:', data.signedUrl.substring(0, 100) + '...');
    console.log('  Expires in: 1 hour');
    return true;
  } catch (error: any) {
    console.error('❌ Create signed URL failed:', error.message);
    console.error('Error details:', error);
    return false;
  }
}

async function testListObjects(bucketName: string) {
  console.log(`\n=== Testing List Objects in Bucket: ${bucketName} ===`);
  try {
    const { data, error } = await supabase.storage.from(bucketName).list('', {
      limit: 10,
      offset: 0,
    });

    if (error) {
      throw error;
    }

    console.log(`✅ List objects successful`);
    console.log(`  Total objects: ${data?.length || 0}`);

    if (data && data.length > 0) {
      data.forEach((obj) => {
        const size = obj.metadata?.size || 0;
        const modified = obj.updated_at || obj.created_at;
        console.log(`  - ${obj.name} (Size: ${size} bytes, Modified: ${modified})`);
      });
    } else {
      console.log('  No objects in bucket');
    }

    return true;
  } catch (error: any) {
    console.error('❌ List objects failed:', error.message);
    console.error('Error details:', error);
    return false;
  }
}

async function testDeleteObject(bucketName: string, key: string) {
  console.log(`\n=== Testing Delete Object: ${key} ===`);
  try {
    const { data, error } = await supabase.storage.from(bucketName).remove([key]);

    if (error) {
      throw error;
    }

    console.log(`✅ Object deleted successfully`);
    if (data && data.length > 0) {
      console.log('  Deleted files:', data.map((f) => f.name).join(', '));
    }
    return true;
  } catch (error: any) {
    console.error('❌ Delete failed:', error.message);
    console.error('Error details:', error);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('Starting Supabase Storage connectivity tests...');
  console.log('==============================================\n');

  const testBucket = supabaseConfig.bucket;
  const testKey = 'test-file.txt';
  const testContent =
    'This is a test file content for Supabase Storage connectivity testing.\nCreated at: ' +
    new Date().toISOString();

  try {
    // Validate configuration
    if (!supabaseConfig.url || !supabaseConfig.serviceKey) {
      console.error('❌ Missing required configuration:');
      console.error('  Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env file');
      return;
    }

    // 1. Test listing buckets (basic connectivity test)
    console.log('Step 1: Testing basic Supabase Storage connectivity...');
    const canConnect = await testListBuckets();

    if (!canConnect) {
      console.error('\n❌ Cannot connect to Supabase Storage. Please check:');
      console.error('  1. Supabase URL is correct:', supabaseConfig.url);
      console.error('  2. Service key is valid');
      console.error('  3. Network connection is available');
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

    // 7. Test getting signed URL
    console.log('\nStep 7: Testing signed URL generation...');
    await testGetSignedUrl(testBucket, testKey);

    // 8. Test downloading non-existent object (error handling)
    console.log('\nStep 8: Testing error handling (non-existent file)...');
    console.log('  (This should fail - testing error handling)');
    await testDownloadObject(testBucket, 'non-existent-file.txt');

    // 9. Delete the test object
    console.log('\nStep 9: Cleaning up test file...');
    await testDeleteObject(testBucket, testKey);

    // 10. Final verification
    console.log('\nStep 10: Final verification...');
    await testListObjects(testBucket);
  } catch (error) {
    console.error('\n❌ Test suite failed with unexpected error:', error);
  }

  console.log('\n==============================================');
  console.log('Supabase Storage connectivity tests complete!');
  console.log('==============================================\n');

  // Summary
  console.log('Summary:');
  console.log('  Supabase URL:', supabaseConfig.url);
  console.log('  Bucket:', testBucket);
  console.log('  Test file:', testKey);
  console.log(
    '\nIf all tests passed, your Supabase Storage configuration is working correctly! ✅',
  );
  console.log('If you see errors, check your Supabase URL and service key.');
}

// Run the tests
runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
