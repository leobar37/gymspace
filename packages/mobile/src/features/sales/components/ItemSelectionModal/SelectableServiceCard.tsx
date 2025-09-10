import React from 'react';
import { Pressable } from 'react-native';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { View } from '@/components/ui/view';
import { WrenchIcon, CheckCircleIcon } from 'lucide-react-native';
import { useFormatPrice } from '@/config/ConfigContext';
import { AssetPreview } from '@/features/assets/components/AssetPreview';
import type { Product } from '@gymspace/sdk';

interface SelectableServiceCardProps {
  service: Product;
  onPress?: (service: Product) => void;
  isSelected: boolean;
  selectedQuantity: number;
}

export const SelectableServiceCard: React.FC<SelectableServiceCardProps> = ({
  service,
  onPress,
  isSelected,
  selectedQuantity,
}) => {
  const formatPrice = useFormatPrice();
  const isInactive = service.status === 'inactive';

  const handlePress = () => {
    if (!isInactive) {
      onPress?.(service);
    }
  };

  return (
    <Card className={`overflow-hidden p-3 ${isSelected ? 'border-2 border-blue-500 bg-blue-50' : ''} ${isInactive ? 'opacity-60' : ''}`}>
      <Pressable
        onPress={handlePress}
        className="active:opacity-70"
        disabled={isInactive}
      >
        <VStack space="xs">
          {/* Selection Indicator */}
          {isSelected && (
            <View className="absolute top-0 right-0 z-10">
              <Badge size="sm" className="bg-blue-500">
                <HStack space="xs" className="items-center">
                  <Icon as={CheckCircleIcon} className="w-3 h-3 text-white" />
                  <BadgeText className="text-white text-xs">{selectedQuantity}</BadgeText>
                </HStack>
              </Badge>
            </View>
          )}

          {/* Service Image */}
          <View className="h-20 w-full bg-gray-100 rounded-lg items-center justify-center overflow-hidden">
            {service.imageId ? (
              <AssetPreview
                assetId={service.imageId}
                size="small"
                resizeMode="cover"
                showLoading={false}
              />
            ) : (
              <Icon as={WrenchIcon} className="w-8 h-8 text-gray-400" />
            )}
          </View>

          {/* Service Info */}
          <VStack space="xs" className="flex-1">
            {/* Service Name */}
            <Text className="font-medium text-gray-900 text-sm" numberOfLines={2}>
              {service.name}
            </Text>

            {/* Price */}
            <Text className="font-bold text-blue-600 text-sm">
              {formatPrice(service.price)}
            </Text>

            {/* Duration if available */}
            {service.durationMinutes && (
              <Text className="text-xs text-gray-600">
                Duración: {service.durationMinutes} min
              </Text>
            )}

            {/* Inactive Badge */}
            {isInactive && (
              <Badge variant="solid" size="sm" className="self-start bg-gray-500">
                <BadgeText className="text-white text-xs">Inactivo</BadgeText>
              </Badge>
            )}
          </VStack>
        </VStack>
      </Pressable>
    </Card>
  );
};