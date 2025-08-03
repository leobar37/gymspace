# Asset Management

The Assets module handles file uploads, media management, and document storage with MinIO integration.

## Asset Object

```typescript
interface Asset {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number; // in bytes
  url: string;
  thumbnailUrl?: string;
  metadata?: AssetMetadata;
  tags?: string[];
  entityType?: string;
  entityId?: string;
  uploadedBy: string;
  isPublic: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface AssetMetadata {
  width?: number;
  height?: number;
  duration?: number; // for videos
  description?: string;
  alt?: string;
  [key: string]: any;
}
```

## Upload Assets

```typescript
// Upload single file
const asset = await sdk.assets.upload({
  file: fileBlob, // File or Blob
  filename: 'profile-photo.jpg',
  tags: ['profile', 'member'],
  metadata: {
    description: 'Member profile photo',
    alt: 'John Doe profile'
  },
  isPublic: false
});

// Upload with entity association
const document = await sdk.assets.upload({
  file: pdfBlob,
  entityType: 'member',
  entityId: 'member-uuid',
  tags: ['medical', 'certificate'],
  expiresAt: new Date('2025-01-01')
});

// Upload multiple files
const assets = await sdk.assets.uploadMultiple([
  { file: file1, filename: 'image1.jpg' },
  { file: file2, filename: 'image2.jpg' }
]);
```

## Get Assets

```typescript
// Get by ID
const asset = await sdk.assets.getById('asset-uuid');

// List assets
const { data: assets, meta } = await sdk.assets.list({
  page: 1,
  limit: 20,
  mimeType: 'image/*',
  tags: ['profile'],
  entityType: 'member',
  orderBy: 'createdAt',
  order: 'desc'
});

// Search assets
const results = await sdk.assets.search({
  query: 'certificate',
  mimeTypes: ['application/pdf'],
  uploadedAfter: new Date('2024-01-01')
});
```

## Download Assets

```typescript
// Get download URL
const downloadUrl = await sdk.assets.getDownloadUrl('asset-uuid');

// Get temporary signed URL (for private assets)
const signedUrl = await sdk.assets.getSignedUrl('asset-uuid', {
  expiresIn: 3600 // 1 hour
});

// Download as blob
const blob = await sdk.assets.download('asset-uuid');

// Download with progress
await sdk.assets.downloadWithProgress('asset-uuid', {
  onProgress: (progress) => {
    console.log(`Downloaded: ${progress.loaded}/${progress.total}`);
  },
  onComplete: (blob) => {
    // Handle downloaded file
  }
});
```

## Image Processing

```typescript
// Generate thumbnail
const thumbnail = await sdk.assets.generateThumbnail('asset-uuid', {
  width: 200,
  height: 200,
  fit: 'cover'
});

// Resize image
const resized = await sdk.assets.resizeImage('asset-uuid', {
  width: 800,
  height: 600,
  quality: 85,
  format: 'webp'
});

// Get image variants
const variants = await sdk.assets.getImageVariants('asset-uuid');
// Returns URLs for different sizes: thumbnail, small, medium, large

// Create custom variant
const variant = await sdk.assets.createImageVariant('asset-uuid', {
  name: 'hero',
  width: 1920,
  height: 1080,
  quality: 90
});
```

## Asset Organization

```typescript
// Update asset metadata
await sdk.assets.updateMetadata('asset-uuid', {
  description: 'Updated description',
  tags: ['profile', 'verified'],
  customField: 'custom value'
});

// Add tags
await sdk.assets.addTags('asset-uuid', ['important', 'featured']);

// Remove tags
await sdk.assets.removeTags('asset-uuid', ['temporary']);

// Move to folder (logical organization)
await sdk.assets.moveToFolder('asset-uuid', 'members/documents');

// Get assets by tag
const tagged = await sdk.assets.getByTag('medical');
```

## Asset Permissions

```typescript
// Make asset public
await sdk.assets.makePublic('asset-uuid');

// Make asset private
await sdk.assets.makePrivate('asset-uuid');

// Share asset with specific users
await sdk.assets.share('asset-uuid', {
  userIds: ['user1-uuid', 'user2-uuid'],
  expiresAt: new Date('2024-12-31'),
  allowDownload: true
});

// Get shared users
const sharedWith = await sdk.assets.getSharedUsers('asset-uuid');

// Revoke access
await sdk.assets.revokeAccess('asset-uuid', 'user-uuid');
```

## Bulk Operations

```typescript
// Bulk delete
await sdk.assets.bulkDelete(['asset1-uuid', 'asset2-uuid']);

// Bulk update
await sdk.assets.bulkUpdate({
  assetIds: ['asset1-uuid', 'asset2-uuid'],
  updates: {
    tags: ['archived'],
    isPublic: false
  }
});

// Bulk download
const zipBlob = await sdk.assets.bulkDownload(['asset1-uuid', 'asset2-uuid'], {
  filename: 'assets.zip'
});
```

## Asset Analytics

```typescript
// Get storage usage
const usage = await sdk.assets.getStorageUsage();
// Returns: { used: 1073741824, limit: 10737418240, percentage: 10 }

// Get usage by type
const typeUsage = await sdk.assets.getUsageByType();
// Returns: { 'image/jpeg': 500MB, 'application/pdf': 200MB, ... }

// Get asset statistics
const stats = await sdk.assets.getStatistics({
  period: 'monthly',
  metrics: ['uploads', 'downloads', 'storage']
});
```

## Clean Up

```typescript
// Delete asset
await sdk.assets.delete('asset-uuid');

// Clean up expired assets
const cleaned = await sdk.assets.cleanupExpired();
// Returns: { deleted: 15, freedSpace: 150000000 }

// Clean up orphaned assets (not linked to any entity)
const orphaned = await sdk.assets.cleanupOrphaned({
  olderThan: new Date('2023-01-01')
});
```

## Video Processing

```typescript
// Upload video with processing
const video = await sdk.assets.uploadVideo({
  file: videoBlob,
  processOptions: {
    generateThumbnail: true,
    generatePreview: true,
    compress: true,
    formats: ['mp4', 'webm']
  }
});

// Get video metadata
const metadata = await sdk.assets.getVideoMetadata('video-uuid');
// Returns: { duration: 120, width: 1920, height: 1080, codec: 'h264' }

// Generate video thumbnail at specific time
const thumbnail = await sdk.assets.generateVideoThumbnail('video-uuid', {
  time: 10, // seconds
  width: 640,
  height: 360
});
```