import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Icon } from '@/components/ui/icon';
import { Badge, BadgeText } from '@/components/ui/badge';
import type { PaymentMethod } from '@gymspace/sdk';
import { EyeIcon } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

interface PaymentMethodItemProps {
  paymentMethod: PaymentMethod;
  isSelected: boolean;
  onSelect: () => void;
  onViewDetails: () => void;
  icon: LucideIcon;
  colorClass: string;
}

export function PaymentMethodItem({
  paymentMethod,
  isSelected,
  onSelect,
  onViewDetails,
  icon: IconComponent,
  colorClass,
}: PaymentMethodItemProps) {
  const bgColor = colorClass.split(' ')[0];
  const textColor = colorClass.split(' ')[1];

  return (
    <Pressable
      onPress={onSelect}
      className={`
        p-4 rounded-lg border
        ${isSelected ? 'bg-blue-50 border-blue-400' : 'bg-white border-gray-200'}
      `}
    >
      <HStack className="gap-3">
        <View className={`w-10 h-10 p-2 rounded-full items-center justify-center ${bgColor}`}>
          <Icon as={IconComponent} className={textColor} size="sm" />
        </View>

        <VStack className="flex-1 gap-0.5">
          <HStack className="justify-between items-start">
            <VStack className="flex-1 gap-0.5">
              <Text
                className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}
              >
                {paymentMethod.name}
              </Text>
              {paymentMethod.code && (
                <Text
                  className={`text-xs ${isSelected ? 'text-blue-700' : 'text-gray-500'}`}
                >
                  Código: {paymentMethod.code}
                </Text>
              )}
              {paymentMethod.description && (
                <Text
                  className={`text-xs ${isSelected ? 'text-blue-700' : 'text-gray-500'}`}
                >
                  {paymentMethod.description}
                </Text>
              )}
              {paymentMethod.metadata?.phoneNumber && (
                <Text
                  className={`text-xs ${isSelected ? 'text-blue-700' : 'text-gray-500'}`}
                >
                  Tel: {paymentMethod.metadata.phoneNumber}
                </Text>
              )}
            </VStack>
            
            <HStack className="gap-2 items-center">
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  onViewDetails();
                }}
              >
                <Icon as={EyeIcon} className="text-gray-600" />
              </Pressable>
              {isSelected && (
                <View className="bg-blue-500 rounded-full w-5 h-5 items-center justify-center">
                  <Text className="text-white text-xs">✓</Text>
                </View>
              )}
            </HStack>
          </HStack>
          
          {!paymentMethod.enabled && (
            <Badge
              variant="solid"
              action="muted"
              size="sm"
              className="self-start mt-1"
            >
              <BadgeText>Inactivo</BadgeText>
            </Badge>
          )}
        </VStack>
      </HStack>
    </Pressable>
  );
}