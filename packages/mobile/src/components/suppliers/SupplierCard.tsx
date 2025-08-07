import React from 'react';
import { Pressable } from 'react-native';
import { Card } from '@/components/ui/card';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Badge, BadgeText } from '@/components/ui/badge';
import { 
  BuildingIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  UserIcon,
  ChevronRightIcon
} from 'lucide-react-native';
import type { Supplier } from '@gymspace/sdk';

interface SupplierCardProps {
  supplier: Supplier;
  onPress?: (supplier: Supplier) => void;
  showDetails?: boolean;
}

export function SupplierCard({ supplier, onPress, showDetails = true }: SupplierCardProps) {
  const handlePress = () => {
    onPress?.(supplier);
  };

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <Pressable 
        onPress={handlePress}
        className="p-4 active:bg-gray-50"
      >
        <VStack space="sm">
          {/* Header - Supplier Name and Contact */}
          <HStack className="justify-between items-start">
            <VStack className="flex-1">
              <HStack space="xs" className="items-center">
                <Icon as={BuildingIcon} className="w-5 h-5 text-blue-600" />
                <Text className="text-lg font-semibold text-gray-900">
                  {supplier.name}
                </Text>
              </HStack>
              
              {supplier.contactName && (
                <HStack space="xs" className="items-center mt-1">
                  <Icon as={UserIcon} className="w-4 h-4 text-gray-500" />
                  <Text className="text-sm text-gray-700">
                    {supplier.contactName}
                  </Text>
                </HStack>
              )}
            </VStack>
            
            {onPress && (
              <Icon as={ChevronRightIcon} className="w-5 h-5 text-gray-400" />
            )}
          </HStack>

          {showDetails && (
            <>
              {/* Contact Information */}
              <VStack space="xs">
                {supplier.phone && (
                  <HStack space="sm" className="items-center">
                    <Icon as={PhoneIcon} className="w-4 h-4 text-gray-500" />
                    <Text className="text-sm text-gray-600">
                      {supplier.phone}
                    </Text>
                  </HStack>
                )}
                
                {supplier.email && (
                  <HStack space="sm" className="items-center">
                    <Icon as={MailIcon} className="w-4 h-4 text-gray-500" />
                    <Text className="text-sm text-gray-600">
                      {supplier.email}
                    </Text>
                  </HStack>
                )}
                
                {supplier.address && (
                  <HStack space="sm" className="items-start">
                    <Icon as={MapPinIcon} className="w-4 h-4 text-gray-500 mt-0.5" />
                    <Text className="text-sm text-gray-600 flex-1" numberOfLines={2}>
                      {supplier.address}
                    </Text>
                  </HStack>
                )}
              </VStack>

              {/* Notes */}
              {supplier.notes && (
                <Text className="text-sm text-gray-500 bg-gray-50 p-2 rounded" numberOfLines={2}>
                  {supplier.notes}
                </Text>
              )}

              {/* Product Count (if available) */}
              {supplier.products && supplier.products.length > 0 && (
                <HStack className="justify-between items-center pt-2 border-t border-gray-100">
                  <Text className="text-xs text-gray-500">
                    Productos suministrados:
                  </Text>
                  <Badge variant="outline" size="sm">
                    <BadgeText className="text-gray-700">
                      {supplier.products.length} producto{supplier.products.length !== 1 ? 's' : ''}
                    </BadgeText>
                  </Badge>
                </HStack>
              )}
            </>
          )}
        </VStack>
      </Pressable>
    </Card>
  );
}