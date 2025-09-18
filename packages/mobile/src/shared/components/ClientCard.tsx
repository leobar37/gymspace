import React from 'react';
import { View, Pressable } from 'react-native';
import { Card } from '@/components/ui/card';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { UserIcon, CheckCircleIcon, PhoneIcon } from 'lucide-react-native';
import type { Client } from '@gymspace/sdk';

interface ClientCardProps {
  client: Client;
  onPress?: (client: Client) => void;
  disabled?: boolean;
  showCheckInStatus?: boolean;
  canCheckIn?: boolean;
  checkInReason?: string;
  variant?: 'default' | 'compact';
}

export const ClientCard: React.FC<ClientCardProps> = ({
  client,
  onPress,
  disabled = false,
  showCheckInStatus = false,
  canCheckIn = true,
  checkInReason,
  variant = 'default',
}) => {
  const fullName = client.name || 'Sin nombre';
  
  // Get initials for avatar
  const getInitials = (name: string) => {
    const parts = name.split(' ').filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(fullName);
  const avatarSize = variant === 'compact' ? 'w-9 h-9' : 'w-10 h-10';
  const avatarTextSize = variant === 'compact' ? 'text-xs' : 'text-sm';

  return (
    <Pressable onPress={() => onPress?.(client)} disabled={disabled || (!canCheckIn && showCheckInStatus)}>
      <Card
        className={`p-3 ${
          showCheckInStatus && !canCheckIn ? 'bg-gray-50 opacity-60' : 'bg-white'
        } ${!disabled && canCheckIn ? 'active:bg-gray-50' : ''}`}
      >
        <HStack className="items-center gap-3">
          {/* Avatar with initials */}
          <View className={`${avatarSize} bg-blue-100 rounded-full items-center justify-center`}>
            <Text className={`${avatarTextSize} font-semibold text-blue-600`}>{initials}</Text>
          </View>

          {/* Client info */}
          <VStack className="flex-1 gap-0.5">
            <Text className="font-medium text-gray-900" numberOfLines={1}>
              {fullName}
            </Text>
            
            {/* Document and phone in same line with smaller font */}
            <HStack className="items-center gap-2">
              {client.documentNumber && (
                <Text className="text-[11px] text-gray-500" numberOfLines={1}>
                  {client.documentType || 'CI'} {client.documentNumber}
                </Text>
              )}
              {client.phone && (
                <HStack className="items-center gap-0.5">
                  <Icon as={PhoneIcon} className="w-3 h-3 text-gray-400" />
                  <Text className="text-[11px] text-gray-500" numberOfLines={1}>
                    {client.phone}
                  </Text>
                </HStack>
              )}
            </HStack>

            {/* Client number if exists */}
            {client.clientNumber && (
              <Text className="text-[10px] text-gray-400">#{client.clientNumber}</Text>
            )}

            {/* Check-in status message */}
            {showCheckInStatus && !canCheckIn && checkInReason && (
              <Text className="text-xs text-red-600 mt-1">{checkInReason}</Text>
            )}
          </VStack>

          {/* Status indicator */}
          {showCheckInStatus && canCheckIn && (
            <Icon as={CheckCircleIcon} className="w-5 h-5 text-green-600" />
          )}

          {/* Active status badge */}
          {!showCheckInStatus && client.status === 'active' && (
            <Text className="text-[10px] font-medium text-green-600 uppercase">Activo</Text>
          )}
        </HStack>
      </Card>
    </Pressable>
  );
};