import { Card } from '@/components/ui/card';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { Badge, BadgeText } from '@/components/ui/badge';
import type { Client } from '@gymspace/sdk';
import { CheckCircleIcon, PhoneIcon, MoreHorizontalIcon } from 'lucide-react-native';
import React from 'react';
import { Pressable, View } from 'react-native';
import { ContractStatusBadge } from './ContractStatusBadge';

interface ClientCardProps {
  client: Client;
  onPress?: (client: Client) => void;
  onAction?: (client: Client) => void;
  disabled?: boolean;
  showCheckInStatus?: boolean;
  canCheckIn?: boolean;
  checkInReason?: string;
  variant?: 'minimal' | 'complete' | 'default' | 'compact';
}

export const ClientCard: React.FC<ClientCardProps> = ({
  client,
  onPress,
  onAction,
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

  // Determine sizes based on variant
  const isCompact = variant === 'compact';
  const isMinimal = variant === 'minimal';
  const avatarSize = isCompact ? 'w-9 h-9' : 'w-10 h-10';
  const avatarTextSize = isCompact ? 'text-xs' : 'text-sm';

  const handlePress = () => {
    if (onPress) {
      onPress(client);
    }
  };

  // Minimal variant - only name and document
  if (isMinimal) {
    return (
      <Card className="p-3 bg-white">
        <Pressable onPressIn={handlePress}>
          <HStack className="items-center gap-3">
            <View className={`${avatarSize} bg-blue-100 rounded-full items-center justify-center`}>
              <Text className={`${avatarTextSize} font-semibold text-blue-600`}>{initials}</Text>
            </View>
            <VStack className="flex-1">
              <Text className="font-medium text-gray-900" numberOfLines={1}>
                {fullName}
              </Text>
              {client.documentValue && (
                <Text className="text-xs text-gray-500">
                  {client.documentType || 'CI'} {client.documentValue}
                </Text>
              )}
            </VStack>
          </HStack>
        </Pressable>
      </Card>
    );
  }

  return (
    <Card
      className={`p-3 py-5 ${
        showCheckInStatus && !canCheckIn ? 'bg-gray-50 opacity-60' : 'bg-white'
      } ${!disabled ? 'active:bg-gray-50' : ''}`}
    >
      <Pressable onPress={handlePress}>
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
            <VStack className="items-start gap-2">
              {client.documentValue && (
                <Text className="text-[11px] text-gray-500 uppercase">
                  {client.documentType || 'CI'} {client.documentValue}
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
            </VStack>
            {/* Check-in status message */}
            {showCheckInStatus && !canCheckIn && checkInReason && (
              <Text className="text-xs text-red-600 mt-1">{checkInReason}</Text>
            )}
          </VStack>

          {/* Status indicators and actions */}
          <VStack className="items-end gap-2">
            {/* Check-in status */}
            {showCheckInStatus && canCheckIn && (
              <Icon as={CheckCircleIcon} className="w-5 h-5 text-green-600" />
            )}

            {/* Complete variant - optimized badges and actions */}
            {variant === 'complete' && onAction && (
              <>
                {/* Action button in top right */}
                <Pressable onPress={() => onAction(client)} className="p-1 -mt-1 -mr-1">
                  <Icon as={MoreHorizontalIcon} className="text-gray-400" size="md" />
                </Pressable>

                {/* Status badges stack */}
                <VStack className="items-end gap-1">
                  {/* Show status badge only if no active plan, or if client is inactive */}
                  {(!client.contracts || client.contracts.length === 0 || client.status !== 'active') && (
                    <Badge
                      variant={client.status === 'active' ? 'solid' : 'outline'}
                      action={client.status === 'active' ? 'success' : 'muted'}
                      className="px-2 py-1"
                    >
                      <BadgeText className="text-xs font-medium">
                        {client.status === 'active' ? 'ACTIVO' : 'INACTIVO'}
                      </BadgeText>
                    </Badge>
                  )}

                  <ContractStatusBadge contracts={client.contracts} />
                </VStack>
              </>
            )}

            {/* Standard management mode - less optimized */}
            {variant !== 'complete' && onAction && (
              <VStack className="items-end gap-1">
                {/* Show status badge only if no active plan, or if client is inactive */}
                {(!client.contracts || client.contracts.length === 0 || client.status !== 'active') && (
                  <Badge variant="solid" action={client.status === 'active' ? 'success' : 'muted'}>
                    <BadgeText className="text-xs">
                      {client.status === 'active' ? 'Activo' : 'Inactivo'}
                    </BadgeText>
                  </Badge>
                )}

                <ContractStatusBadge contracts={client.contracts} />
              </VStack>
            )}

            {/* Active status badge for non-management modes */}
            {!showCheckInStatus &&
             !onAction &&
             client.status === 'active' &&
             (!client.contracts || client.contracts.length === 0) && (
              <Text className="text-[10px] font-medium text-green-600 uppercase">Activo</Text>
            )}
          </VStack>
        </HStack>
      </Pressable>
    </Card>
  );
};
