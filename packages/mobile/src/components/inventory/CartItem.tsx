import React from 'react';
import { Pressable } from 'react-native';
import { Card } from '@/components/ui/card';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { View } from '@/components/ui/view';
import { TrashIcon, PackageIcon } from 'lucide-react-native';
import { QuantitySelector } from './QuantitySelector';
import { AssetPreview } from '@/features/assets/components/AssetPreview';
import { useFormatPrice } from '@/config/ConfigContext';
import type { CartItem as CartItemType } from '@/features/sales/types';

interface CartItemProps {
  item: CartItemType;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
  compact?: boolean; // compact layout with reduced padding
  hideDivider?: boolean; // hide bottom divider (e.g. last item)
  showImage?: boolean; // allow hiding image to save space
  lowStockThreshold?: number; // threshold to show low stock badge
}

export function CartItem({
  item,
  onQuantityChange,
  onRemove,
  compact = false,
  hideDivider = false,
  showImage = true,
  lowStockThreshold = 10,
}: CartItemProps) {
  const formatPrice = useFormatPrice();
  const { product, quantity, total } = item;

  // Clases para modo normal vs compacto
  const paddingClass = compact ? 'px-3 py-2.5' : 'p-4';
  const imageSizeWrapper = compact ? 'w-14 h-14' : 'w-16 h-16';
  const nameTextClass = compact ? 'text-[13px]' : 'text-sm';
  const unitPriceTextClass = compact ? 'text-[11px]' : 'text-xs';
  const totalTextClass = compact ? 'text-[15px]' : 'text-base';

  return (
    <View
      className={`bg-white ${hideDivider ? '' : 'border-b border-b-gray-100'} ${compact ? '' : ''}`}
    >
      <HStack space={"md"} className={`${paddingClass} items-center`}>
        {showImage && (
          <View
            className={`${imageSizeWrapper} bg-gray-100 rounded-md overflow-hidden items-center justify-center`}
          >
            {product.imageId ? (
              <AssetPreview
                assetId={product.imageId}
                size="small"
                width={56}
                height={56}
                resizeMode="cover"
                showLoading={false}
              />
            ) : (
              <Icon as={PackageIcon} className="w-6 h-6 text-gray-400" />
            )}
          </View>
        )}

        <VStack className="flex-1" space="xs">
          <HStack className="justify-between items-start">
            <VStack className="flex-1 mr-1">
              <Text className={`text-gray-900 font-semibold ${nameTextClass}`} numberOfLines={2}>
                {product.name}
              </Text>
            </VStack>

            {/* Remove Button */}
            <Pressable
              onPress={onRemove}
              hitSlop={8}
              className={`items-center justify-center rounded-full ${compact ? 'w-8 h-8' : 'w-8 h-8'} active:bg-red-50`}
            >
              <Icon
                as={TrashIcon}
                className={`${compact ? 'w-4 h-4' : 'w-4 h-4'} text-red-500`}
              />
            </Pressable>
          </HStack>

          <HStack className="justify-between items-center -mt-1">
            <QuantitySelector
              quantity={quantity}
              onQuantityChange={onQuantityChange}
              min={1}
              max={product.stock || 999}
              size={compact ? 'sm' : 'sm'}
            />
            <VStack className="items-end" space="0">
              <Text
                className={`text-gray-900 font-semibold ${totalTextClass}`}
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {formatPrice(total)}
              </Text>
              <Text
                className={`text-gray-500 ${unitPriceTextClass}`}
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {formatPrice(product.price)} c/u
              </Text>
            </VStack>
          </HStack>

          {product.stock && product.stock <= lowStockThreshold && (
            <View>
              <Text className="px-2 py-[2px] bg-orange-50 text-orange-600 rounded-full text-[10px] font-medium">
                Stock: {product.stock}
              </Text>
            </View>
          )}
        </VStack>
      </HStack>
    </View>
  );
}
