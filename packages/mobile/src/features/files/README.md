# Files Management Feature

This feature provides a complete file management system for the Gym Management System, replacing the assets system with a more robust and collision-resistant file system.

## Key Features

- **Unique Identifier Generation**: Uses nanoid to generate collision-resistant file identifiers
- **Multi-tenancy Support**: Files are scoped by gym ID
- **Soft Delete**: Files are soft-deleted with recovery capability
- **Preview Support**: Automatic preview URL generation for images, PDFs, and videos
- **Single & Multiple Upload**: PhotoField supports both single and multiple file uploads
- **Optimistic UI**: Immediate preview of selected photos before upload

## Architecture

### Backend (NestJS)

- **Module**: `/packages/api/src/modules/files`
- **Controller**: Handles upload, download, delete, and render operations
- **Service**: Manages file storage and database operations
- **Permissions**: FILES_CREATE, FILES_READ, FILES_DELETE

### SDK

- **Resource**: `/packages/sdk/src/resources/files.ts`
- **Models**: `/packages/sdk/src/models/files.ts`
- **Methods**: upload, findOne, findByIds, delete, download, getRenderUrl

### Frontend (React Native)

- **Controller**: `/packages/mobile/src/features/files/controllers/files.controller.ts`
- **Components**: PhotoField for single/multiple photo uploads
- **Types**: FileFieldValue, PendingFileValue for form handling

## Usage

### Single Photo Upload

```tsx
import { PhotoField } from '@/features/files/components/PhotoField';

<PhotoField
  name="profilePhoto"
  control={control}
  label="Profile Photo"
  description="Upload a profile photo"
  multiple={false}
  aspectRatio={[1, 1]}
  quality={0.9}
/>
```

### Multiple Photos Upload

```tsx
<PhotoField
  name="galleryPhotos"
  control={control}
  label="Gallery Photos"
  description="Upload up to 5 photos"
  multiple={true}
  maxFiles={5}
  quality={0.8}
/>
```

### Form Submission with File Upload

```tsx
import { prepareFiles } from '@/features/files/types/file-form.types';
import { useFilesController } from '@/features/files/controllers/files.controller';

const { uploadFile } = useFilesController();

const onSubmit = async (data) => {
  // Automatically uploads pending files and replaces them with file IDs
  const processedData = await prepareFiles(data, uploadFile);
  
  // processedData now has file IDs instead of file objects
  await saveToAPI(processedData);
};
```

## API Endpoints

- `POST /api/v1/files/upload` - Upload a new file
- `GET /api/v1/files/:id` - Get file metadata
- `GET /api/v1/files/by-ids` - Get multiple files by IDs
- `GET /api/v1/files/:id/download` - Download file
- `GET /api/v1/files/:id/render` - Render file for preview (public)
- `DELETE /api/v1/files/:id` - Soft delete file

## Migration from Assets

When migrating from the assets system:

1. Update imports from `@/features/assets` to `@/features/files`
2. Replace `useAsset` with `useFile`
3. Replace `AssetFieldValue` with `FileFieldValue`
4. Update field names from asset-related to file-related (e.g., `profilePhotoId`)

## Security

- Files are scoped by gym ID for multi-tenancy
- Soft delete allows recovery
- Unique identifiers prevent collisions
- Public render endpoint for previews
- Permission-based access control

## Performance

- Cached queries with 5-minute stale time
- Optimistic UI updates
- Efficient batch fetching with `findByIds`
- Preview URLs generated without API calls