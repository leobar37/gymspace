import { Avatar, AvatarFallbackText, AvatarImage } from '@/components/ui/avatar';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Button, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { EditIcon } from 'lucide-react-native';
import React from 'react';

interface ClientHeaderProps {
  client: {
    name?: string;
    clientNumber?: string;
    status?: string;
  };
  profilePhotoUrl?: string;
  onEdit: () => void;
}

export const ClientHeader: React.FC<ClientHeaderProps> = ({ client, profilePhotoUrl, onEdit }) => {
  return (
    <Card>
      <VStack className="gap-4">
        <HStack className="items-center gap-4">
          <Avatar size="xl">
            {profilePhotoUrl ? (
              <AvatarImage source={{ uri: profilePhotoUrl }} alt={client?.name || 'Client'} />
            ) : null}
            <AvatarFallbackText>
              {client?.name
                ? client.name
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                : '?'}
            </AvatarFallbackText>
          </Avatar>
          <VStack className="flex-1">
            <Text className="text-xl font-semibold text-gray-900">
              {client?.name || 'Sin nombre'}
            </Text>
            <Text className="text-sm text-gray-600">Cliente #{client?.clientNumber || 'N/A'}</Text>
            <Badge variant="solid" action={client?.status === 'active' ? 'success' : 'muted'}>
              <BadgeText>{client?.status === 'active' ? 'Activo' : 'Inactivo'}</BadgeText>
            </Badge>
          </VStack>
        </HStack>
        <Button onPress={onEdit} className="w-full">
          <HStack className="items-center gap-2">
            <Icon as={EditIcon} className="w-4 h-4" />
            <ButtonText>Editar Cliente</ButtonText>
          </HStack>
        </Button>
      </VStack>
    </Card>
  );
};
