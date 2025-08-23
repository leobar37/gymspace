# FileSelector Component

## Overview

The FileSelector is a React Native form component that provides file upload functionality with image selection from camera or gallery. It integrates with React Hook Form for form state management and supports both single and multiple file selection modes.

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `name` | `string` | ✅ | - | Form field name for react-hook-form |
| `multi` | `boolean` | ❌ | `false` | Enable multiple file selection |
| `label` | `string` | ❌ | - | Optional label text |
| `required` | `boolean` | ❌ | `false` | Mark field as required |

## Features

### File Selection
- **Gallery Selection**: Pick images from device photo library
- **Camera Capture**: Take photos directly with device camera
- **Multiple Selection**: Support for multiple files when `multi=true`

### File Management
- **Preview**: Display selected files with thumbnails
- **Delete**: Remove files via long press action
- **View**: Full-screen file viewing for images and videos
- **Replace**: Replace existing files in single mode

### Form Integration
- **React Hook Form**: Full integration with form validation
- **Validation**: Required field validation support
- **Error Display**: Form error message display

### User Experience
- **Loading States**: Visual feedback during upload/delete operations
- **Action Sheets**: Native-style selection and action menus
- **Grid Layout**: Multi-file display in responsive grid
- **Placeholders**: Clear visual cues for adding files

## Usage

### Basic Single File Selection

```tsx
import { FileSelector } from '@/features/files/components/FileSelector';
import { FormProvider, useForm } from 'react-hook-form';

function MyForm() {
  const methods = useForm();

  return (
    <FormProvider {...methods}>
      <FileSelector
        name="profileImage"
        label="Foto de perfil"
        required
      />
    </FormProvider>
  );
}
```

### Multiple File Selection

```tsx
<FileSelector
  name="documentImages"
  label="Documentos"
  multi={true}
/>
```

## Technical Implementation

### File Upload Flow
1. User selects source (camera/gallery) via action sheet
2. Image picker returns selected assets
3. Assets converted to File objects
4. Files uploaded via `useUploadFile` mutation
5. Form value updated with file IDs

### File Deletion Flow
1. User long-presses file thumbnail
2. Action sheet appears with view/delete options
3. Delete operation removes file from server
4. Form value updated to remove file ID

### State Management
- Form state managed by React Hook Form
- Loading states handled by `useLoadingScreen`
- File viewing managed by `useFilesStore`

### Data Flow
```
Form Value (fileIds) → useFilesByIds → File Objects → FilePreview
```

## Dependencies

### Custom Hooks
- `useUploadFile` - File upload mutation
- `useDeleteFile` - File deletion mutation  
- `useFilesByIds` - Fetch file data by IDs
- `useLoadingScreen` - Loading state management
- `useFilesStore` - File viewer state

### Utilities
- `pickImageFromLibrary` - Gallery image selection
- `pickImageFromCamera` - Camera image capture
- `createFileFromAsset` - Convert asset to File object

### UI Components
- `FilePreview` - File thumbnail display
- `Actionsheet` - Native-style action menus
- Gluestack UI components for layout and styling

## File Types

### Input
- Form value: `string | string[] | null`
  - Single mode: File ID string or null
  - Multi mode: Array of file ID strings

### Output
- Uploaded files are stored on server
- Form receives file IDs for reference
- File metadata available via `useFilesByIds`

## Layout Modes

### Single File Mode (`multi=false`)
- Large preview area (h-80)
- Replace existing file on new selection
- Single file management

### Multiple File Mode (`multi=true`)
- 2-column grid layout
- Add new files to collection
- Individual file management
- File count display

## Error Handling

- Form validation errors displayed below component
- Upload/delete operation errors handled by `useLoadingScreen`
- Network failures gracefully handled
- Old file cleanup on replacement

## Accessibility

- Pressable areas with appropriate touch targets
- Visual feedback for interactive elements
- Clear action descriptions in sheets
- Loading state announcements

## Performance Considerations

- Lazy loading of file data via React Query
- Optimized image display with resize modes
- Efficient grid rendering with FlatList
- Memory management for large file collections