import type { AssetResponseDto } from '@gymspace/sdk';
import Constants from 'expo-constants';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Image, ImageContentFit } from 'expo-image';

// Get the API base URL from constants
const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5200/api/v1';

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
  className?: string;
  showLoading?: boolean;
  resizeMode?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

export function AssetPreview({
  asset,
  assetId,
  width,
  height,
  className = '',
  showLoading = true,
  resizeMode = 'cover',
}: AssetPreviewProps) {
  // Construct the render URL directly without using hooks
  const renderUrl = getAssetRenderUrl(assetId || asset?.id);

  const assetData = asset;

  // Default dimensions if not provided
  const imageWidth = width || 200;
  const imageHeight = height || 200;

  if (!renderUrl && !assetData?.previewUrl) {
    return (
      <View 
        className={`bg-gray-200 items-center justify-center ${className}`} 
        style={{ width: imageWidth, height: imageHeight }}
      >
        {showLoading && (
          <ActivityIndicator size="small" color="#666" />
        )}
      </View>
    );
  }

  const url = renderUrl || assetData?.previewUrl || '';

  console.log('Final URL to render:', url, {
    width: imageWidth,
    height: imageHeight,
    hasSpecificDimensions: !!(width && height),
  });

  // Using expo-image for better performance and caching
  return (
    <Image
      source={{ uri: url }}
      style={{ width: imageWidth, height: imageHeight }}
      className={className}
      contentFit={resizeMode as ImageContentFit}
      transition={200}
      placeholder={{
        blurhash: 'L1O|b2-;fQ-;_3fQfQfQfQfQfQfQ',
      }}
      cachePolicy="memory-disk"
      priority="high"
      onError={(error) => {
        console.error('Error loading asset preview:', error);
      }}
      onLoad={() => {
        console.log('Image loaded successfully:', url);
      }}
      accessible={true}
      accessibilityLabel={assetData?.originalName || 'Asset preview'}
    />
  );
}