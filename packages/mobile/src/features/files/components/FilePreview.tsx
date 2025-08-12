import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Image } from '@/components/ui/image';
import { Icon } from '@/components/ui/icon';
import { FileIcon, VideoIcon, FileTextIcon } from 'lucide-react-native';
import type { FileResponseDto } from '@gymspace/sdk';

interface FilePreviewProps {
  file: FileResponseDto;
  width?: number;
  height?: number;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  className?: string;
}

export function FilePreview({
  file,
  width = 100,
  height = 100,
  resizeMode = 'cover',
  className = '',
}: FilePreviewProps) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const isImage = file.mimeType.startsWith('image/');
  const isVideo = file.mimeType.startsWith('video/');
  const isPdf = file.mimeType === 'application/pdf';

  // Determine icon based on file type
  const getFileIcon = () => {
    if (isVideo) return VideoIcon;
    if (isPdf) return FileTextIcon;
    return FileIcon;
  };

  if (error || !isImage) {
    const FileIconComponent = getFileIcon();
    return (
      <View
        className={`bg-gray-100 items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <Icon
          as={FileIconComponent}
          size="xl"
          className="text-gray-400"
        />
      </View>
    );
  }

  return (
    <View style={{ width, height }} className={className}>
      {loading && (
        <View className="absolute inset-0 bg-gray-100 items-center justify-center">
          <ActivityIndicator size="small" />
        </View>
      )}
      <Image
        source={{ uri: file.previewUrl || '' }}
        style={{ width: '100%', height: '100%' }}
        resizeMode={resizeMode}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        alt={file.originalName}
        className="w-full h-full"
      />
    </View>
  );
}