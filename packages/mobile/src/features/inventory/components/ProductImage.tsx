import React from 'react';
import { View } from 'react-native';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { AssetPreview } from '@/features/assets/components/AssetPreview';
import { PackageIcon } from 'lucide-react-native';

interface ProductImageProps {
  imageId?: string | null;
  productName: string;
}

export const ProductImage: React.FC<ProductImageProps> = ({ 
  imageId, 
  productName 
}) => {
  return (
    <Card className="bg-white border border-gray-200">
      <View className="h-48 bg-gray-100 rounded-t-lg items-center justify-center">
        {imageId ? (
          <AssetPreview
            assetId={imageId}
            width={undefined}
            height={192}
            className="w-full rounded-t-lg"
            resizeMode="contain"
          />
        ) : (
          <Icon as={PackageIcon} className="w-16 h-16 text-gray-400" />
        )}
      </View>
    </Card>
  );
};