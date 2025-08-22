import React from 'react';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Button, ButtonText } from '@/components/ui/button';
import { 
  Building, 
  MapPin, 
  DollarSign,
  Clock,
  Edit2
} from 'lucide-react-native';

interface OrganizationInfoCardProps {
  organization: {
    id: string;
    name: string;
    country?: string;
    currency?: string;
    timezone?: string;
    settings?: Record<string, any>;
  };
  onEdit?: () => void;
}

export default function OrganizationInfoCard({ 
  organization, 
  onEdit 
}: OrganizationInfoCardProps) {
  return (
    <Card className="p-4 bg-white rounded-xl shadow-sm">
      <VStack space="md">
        <HStack className="items-center justify-between">
          <HStack className="items-center" space="sm">
            <Icon as={Building} size="sm" className="text-blue-600" />
            <Text className="text-lg font-semibold text-gray-900">
              {organization.name}
            </Text>
          </HStack>
          {onEdit && (
            <Button 
              size="sm" 
              variant="outline"
              onPress={onEdit}
              className="px-3"
            >
              <HStack className="items-center" space="xs">
                <Icon as={Edit2} size="xs" />
                <ButtonText className="text-sm">Editar Nombre</ButtonText>
              </HStack>
            </Button>
          )}
        </HStack>
        
        <VStack space="sm">
          {organization.country && (
            <HStack className="items-center" space="sm">
              <Icon as={MapPin} size="xs" className="text-gray-400" />
              <Text className="text-sm text-gray-600">
                País: {organization.country}
              </Text>
            </HStack>
          )}
          
          {organization.currency && (
            <HStack className="items-center" space="sm">
              <Icon as={DollarSign} size="xs" className="text-gray-400" />
              <Text className="text-sm text-gray-600">
                Moneda: {organization.currency}
              </Text>
            </HStack>
          )}
          
          {organization.timezone && (
            <HStack className="items-center" space="sm">
              <Icon as={Clock} size="xs" className="text-gray-400" />
              <Text className="text-sm text-gray-600">
                Zona horaria: {organization.timezone}
              </Text>
            </HStack>
          )}
        </VStack>
      </VStack>
    </Card>
  );
}