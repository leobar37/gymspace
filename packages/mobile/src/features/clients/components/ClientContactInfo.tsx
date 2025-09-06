import { Card } from '@/components/ui/card';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { CalendarIcon, MailIcon, PhoneIcon } from 'lucide-react-native';
import React from 'react';

interface ClientContactInfoProps {
  phone?: string;
  email?: string;
  birthDate: string;
}

export const ClientContactInfo: React.FC<ClientContactInfoProps> = ({
  phone,
  email,
  birthDate,
}) => {
  return (
    <Card className="p-4">
      <Text className="font-semibold text-gray-900 mb-3">Información de Contacto</Text>
      <VStack className="gap-3">
        {phone && (
          <HStack className="items-center gap-3">
            <Icon as={PhoneIcon} className="w-4 h-4 text-gray-500" />
            <Text className="text-gray-700">{phone}</Text>
          </HStack>
        )}
        {email && (
          <HStack className="items-center gap-3">
            <Icon as={MailIcon} className="w-4 h-4 text-gray-500" />
            <Text className="text-gray-700">{email}</Text>
          </HStack>
        )}
        <HStack className="items-center gap-3">
          <Icon as={CalendarIcon} className="w-4 h-4 text-gray-500" />
          <Text className="text-gray-700">
            Nacimiento: {new Date(birthDate).toLocaleDateString()}
          </Text>
        </HStack>
      </VStack>
    </Card>
  );
};