import React from 'react';
import { View, ActivityIndicator, Modal, TouchableOpacity, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { FileIcon, VideoIcon, FileTextIcon, XIcon } from 'lucide-react-native';
import type { FileResponseDto } from '@gymspace/sdk';
import { useFile } from '../controllers/files.controller';

interface FilePreviewProps {
  file: FileResponseDto;
  width?: number;
  height?: number;
  resizeMode?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
  className?: string;
  fullscreenEnabled?: boolean;
}

export function FilePreview({
  file,
  width = 100,
  height = 100,
  resizeMode = 'cover',
  className = '',
  fullscreenEnabled = false,
}: FilePreviewProps) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(false);
  const [showFullscreen, setShowFullscreen] = React.useState(false);

  const isImage = file.mimeType.startsWith('image/');
  const isVideo = file.mimeType.startsWith('video/');
  const isPdf = file.mimeType === 'application/pdf';

  const handleImagePress = () => {
    if (fullscreenEnabled && isImage) {
      setShowFullscreen(true);
    }
  };

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
        <Icon as={FileIconComponent} size="xl" className="text-gray-400" />
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity 
        className={className} 
        style={{ width, height }}
        onPress={handleImagePress}
        disabled={!fullscreenEnabled || !isImage}
        activeOpacity={fullscreenEnabled && isImage ? 0.7 : 1}
      >
        {loading && (
          <View className="absolute inset-0 bg-gray-100 items-center justify-center">
            <ActivityIndicator size="small" />
          </View>
        )}
        <Image
          source={{ uri: file.previewUrl || '' }}
          style={{ width, height }}
          contentFit={resizeMode}
          onLoadStart={() => {
            setLoading(true);
            setError(false);
          }}
          onLoad={() => {
            setLoading(false);
          }}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
        />
      </TouchableOpacity>

      {/* Fullscreen Modal */}
      {fullscreenEnabled && (
        <Modal
          visible={showFullscreen}
          transparent={true}
          animationType="fade"
          statusBarTranslucent={true}
          onRequestClose={() => setShowFullscreen(false)}
        >
          <View className="flex-1 bg-black">
            {/* Close Button */}
            <View className="absolute top-12 right-4 z-10">
              <Pressable
                onPress={() => setShowFullscreen(false)}
                className="bg-black/50 rounded-full p-3"
              >
                <Icon as={XIcon} className="text-white" size="md" />
              </Pressable>
            </View>

            {/* Fullscreen Image */}
            <View className="flex-1 items-center justify-center">
              <Image
                source={{ uri: file.previewUrl || '' }}
                style={{ width: '100%', height: '100%' }}
                contentFit="contain"
              />
            </View>

            {/* Image Info */}
            <View className="absolute bottom-8 left-4 right-4">
              <View className="bg-black/70 rounded-lg p-3">
                <Text className="text-white text-sm font-medium">
                  {file.originalName}
                </Text>
                {(file as any)?.size && (
                  <Text className="text-white/70 text-xs mt-1">
                    Tamaño: {((file as any)?.size / 1024 / 1024).toFixed(2)} MB
                  </Text>
                )}
              </View>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

interface PreviewFileProps {
  fileId: string;
  width?: number;
  height?: number;
  resizeMode?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
  className?: string;
  fullscreenEnabled?: boolean;
}

export function PreviewFile({
  fileId,
  width,
  height,
  resizeMode,
  className,
  fullscreenEnabled,
}: PreviewFileProps) {
  const { data: file, isLoading, isError } = useFile(fileId);

  if (isLoading) {
    return (
      <View
        className={`bg-gray-100 items-center justify-center ${className || ''}`}
        style={{ width: width || 100, height: height || 100 }}
      >
        <ActivityIndicator size="small" />
      </View>
    );
  }

  if (isError || !file) {
    return (
      <View
        className={`bg-gray-100 items-center justify-center ${className || ''}`}
        style={{ width: width || 100, height: height || 100 }}
      >
        <Icon as={FileIcon} size="xl" className="text-gray-400" />
        <Text className="text-gray-500 text-xs mt-2">Error loading file</Text>
      </View>
    );
  }

  return (
    <FilePreview
      file={file}
      width={width}
      height={height}
      resizeMode={resizeMode}
      className={className}
      fullscreenEnabled={fullscreenEnabled}
    />
  );
}
