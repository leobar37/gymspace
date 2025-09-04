import type { AssetResponseDto } from '@gymspace/sdk';
import { Image, ImageContentFit } from 'expo-image';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

// Get the API base URL from constants
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

// Simple function to construct render URL without needing SDK
function getAssetRenderUrl(assetId: string | null | undefined): string | null {
  if (!assetId) return null;
  // Construct the URL directly
  return `${API_BASE_URL}/assets/${assetId}/render`;
}

interface AssetPreviewProps {
  asset?: AssetResponseDto;
  assetId?: string;
  width?: number;
  height?: number;
  size?: 'small' | 'medium' | 'large' | 'full';
  className?: string;
  showLoading?: boolean;
  resizeMode?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

export function AssetPreview({
  asset,
  assetId,
  width,
  height,
  size,
  className = '',
  showLoading = true,
  resizeMode = 'cover',
}: AssetPreviewProps) {
  // Construct the render URL directly without using hooks
  const renderUrl = getAssetRenderUrl(assetId || asset?.id);
  const assetData = asset;
  // Determine dimensions based on size prop or explicit width/height
  let imageWidth = width;
  let imageHeight = height;

  if (size && !width && !height) {
    switch (size) {
      case 'small':
        imageWidth = 80;
        imageHeight = 80;
        break;
      case 'medium':
        imageWidth = 150;
        imageHeight = 150;
        break;
      case 'large':
        imageWidth = 300;
        imageHeight = 300;
        break;
      case 'full':
        // Will use flex: 1
        break;
      default:
        imageWidth = 200;
        imageHeight = 200;
    }
  }

  // Default dimensions if still not provided
  imageWidth = imageWidth || 200;
  imageHeight = imageHeight || 200;

  if (!renderUrl && !assetData?.previewUrl) {
    return (
      <View
        className={`bg-gray-200 items-center justify-center ${className}`}
        style={{ width: imageWidth, height: imageHeight }}
      >
        {showLoading && <ActivityIndicator size="small" color="#666" />}
      </View>
    );
  }

  // http://192.168.100.19:5200/api/v1

  const url = renderUrl || assetData?.previewUrl || '';

  console.log('this the url', url);

  const imageStyle =
    size === 'full' && !width && !height ? { flex: 1 } : { width: imageWidth, height: imageHeight };

  return (
    <Image
      source={{ uri: url }}
      style={imageStyle}
      className={className}
      contentFit={resizeMode as ImageContentFit}
      transition={200}
      placeholder={{
        blurhash: 'L1O|b2-;fQ-;_3fQfQfQfQfQfQfQ',
      }}
      cachePolicy="memory-disk"
      priority="high"
      onError={(error) => {
        console.error('Error loading asset preview:', error, 'URL:', url);
      }}
      onLoad={() => {
        console.log('Image loaded successfully:', url);
      }}
      accessible={true}
      accessibilityLabel={assetData?.originalName || 'Asset preview'}
    />
  );
}
