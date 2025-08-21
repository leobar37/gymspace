import React from 'react';
import { Pressable } from 'react-native';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { View } from '@/components/ui/view';
import { WrenchIcon } from 'lucide-react-native';
import { useFormatPrice } from '@/config/ConfigContext';
import { AssetPreview } from '@/features/assets/components/AssetPreview';
import type { Product } from '@gymspace/sdk';

interface ServiceCardProps {
  service: Product;
  onPress?: (service: Product) => void;
  onLongPress?: (service: Product) => void;
  compact?: boolean;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onPress,
  onLongPress,
  compact = false,
}) => {
  const formatPrice = useFormatPrice();
  const isInactive = service.status === 'inactive';

  const handlePress = () => {
    onPress?.(service);
  };

  const handleLongPress = () => {
    onLongPress?.(service);
  };

  return (
    <Card className={`overflow-hidden ${compact ? 'p-3' : 'p-4'} ${isInactive ? 'opacity-60' : ''}`}>
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        className="active:opacity-70"
      >
        <VStack space={compact ? 'xs' : 'sm'}>
          {/* Service Image */}
          <View className={`${compact ? 'h-20' : 'h-24'} w-full bg-blue-50 rounded-lg items-center justify-center overflow-hidden`}>
            {service.imageId ? (
              <AssetPreview
                assetId={service.imageId}
                size="small"
                resizeMode="cover"
                showLoading={false}
              />
            ) : (
              <Icon 
                as={WrenchIcon} 
                className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} text-blue-500`} 
              />
            )}
          </View>

          {/* Service Info */}
          <VStack space="xs" className="flex-1">
            {/* Category Badge */}
            {service.category && !compact && (
              <Badge 
                variant="outline"
                size="sm"
                className="self-start"
                style={{ backgroundColor: service.category.color + '20' || '#dbeafe' }}
              >
                <BadgeText className="text-xs" style={{ color: service.category.color || '#3b82f6' }}>
                  {service.category.name}
                </BadgeText>
              </Badge>
            )}

            {/* Service Name */}
            <Text 
              className={`font-medium text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}
              numberOfLines={2}
            >
              {service.name}
            </Text>

            {/* Description */}
            {service.description && !compact && (
              <Text 
                className="text-xs text-gray-600" 
                numberOfLines={2}
              >
                {service.description}
              </Text>
            )}

            {/* Price Row */}
            <HStack className="items-center justify-between mt-1">
              {/* Price */}
              <Text className={`font-bold text-blue-600 ${compact ? 'text-sm' : 'text-base'}`}>
                {formatPrice(service.price)}
              </Text>

              {/* Service Badge */}
              <Badge 
                variant="outline"
                size="sm"
                className="bg-blue-50"
              >
                <BadgeText className="text-blue-600 text-xs">
                  Servicio
                </BadgeText>
              </Badge>
            </HStack>

            {/* Status Indicator */}
            {isInactive && (
              <Badge 
                variant="solid"
                size="sm"
                className="self-start bg-gray-500"
              >
                <BadgeText className="text-white text-xs">
                  Inactivo
                </BadgeText>
              </Badge>
            )}
          </VStack>
        </VStack>
      </Pressable>
    </Card>
  );
};