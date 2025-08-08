import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Image } from '@/components/ui/image';
import { Video, ResizeMode } from 'expo-av';
import { useAssetRenderUrl } from '../controllers/assets.controller';
import type { AssetResponseDto } from '@gymspace/sdk';

interface AssetPreviewProps {
  asset?: AssetResponseDto;
  assetId?: string;
  width?: number;
  height?: number;
  className?: string;
  showLoading?: boolean;
  resizeMode?: 'cover' | 'contain' | 'stretch';
}

export function AssetPreview({
  asset,
  assetId,
  width = 200,
  height = 200,
  className,
  showLoading = true,
  resizeMode = 'cover',
}: AssetPreviewProps) {
  const [isLoading, setIsLoading] = React.useState(true);
  const renderUrl = useAssetRenderUrl(assetId || asset?.id || '');
  
  const assetData = asset;
  
  if (!renderUrl && !assetData?.previewUrl) {
    return (
      <View className={`bg-gray-200 ${className}`} style={{ width, height }}>
        {showLoading && (
          <ActivityIndicator size="small" color="#666" style={styles.loader} />
        )}
      </View>
    );
  }
  
  const url = renderUrl || assetData?.previewUrl || '';
  const mimeType = assetData?.mimeType || '';
  
  // Check if it's a video
  const isVideo = mimeType.startsWith('video/');
  
  if (isVideo) {
    return (
      <View className={className} style={{ width, height }}>
        <Video
          source={{ uri: url }}
          style={{ width, height }}
          useNativeControls
          resizeMode={resizeMode === 'cover' ? ResizeMode.COVER : ResizeMode.CONTAIN}
          isLooping={false}
        />
      </View>
    );
  }
  
  // Default to image
  return (
    <View className={className} style={{ width, height }}>
      <Image
        source={{ uri: url }}
        style={{ width, height }}
        resizeMode={resizeMode}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        className="rounded-lg"
      />
      {isLoading && showLoading && (
        <ActivityIndicator size="small" color="#666" style={styles.loader} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -10 }, { translateY: -10 }],
  },
});