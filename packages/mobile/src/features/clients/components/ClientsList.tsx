import React, { useState } from 'react';
import { FlatList, RefreshControl, View, Pressable } from 'react-native';
import { useClientsController } from '../controllers/clients.controller';
import {
  VStack,
  HStack,
  Text,
  Card,
  Avatar,
  Badge,
  BadgeText,
  Spinner,
  Button,
  ButtonText,
  Icon,
  Input,
  InputField,
  InputSlot,
  InputIcon,
} from '@/components/ui';
import { SearchIcon, UserPlusIcon, PhoneIcon } from 'lucide-react-native';
import { router } from 'expo-router';
import { useDebounce } from '@/hooks/useDebounce';

interface ClientCardProps {
  client: any;
  onPress: () => void;
}

const ClientCard: React.FC<ClientCardProps> = ({ client, onPress }) => {
  const hasActiveContract = client.contracts?.length > 0;
  
  return (
    <Pressable onPress={onPress}>
      <Card className="mb-3 p-4">
        <HStack className="items-center justify-between">
          <HStack className="items-center gap-3 flex-1">
            <Avatar className="bg-blue-600">
              <Text className="text-white font-semibold">
                {client.name.split(' ').map((n: string) => n[0]).join('')}
              </Text>
            </Avatar>
            
            <VStack className="flex-1">
              <Text className="font-semibold text-gray-900">{client.name}</Text>
              <Text className="text-sm text-gray-600">{client.clientNumber}</Text>
              {client.phone && (
                <HStack className="items-center gap-1 mt-1">
                  <Icon as={PhoneIcon} className="w-3 h-3 text-gray-500" />
                  <Text className="text-sm text-gray-500">{client.phone}</Text>
                </HStack>
              )}
            </VStack>
          </HStack>
          
          <VStack className="items-end gap-1">
            <Badge
              variant="solid"
              action={client.status === 'active' ? 'success' : 'muted'}
            >
              <BadgeText>{client.status === 'active' ? 'Activo' : 'Inactivo'}</BadgeText>
            </Badge>
            {hasActiveContract && (
              <Badge variant="outline" action="info">
                <BadgeText className="text-xs">Plan activo</BadgeText>
              </Badge>
            )}
          </VStack>
        </HStack>
      </Card>
    </Pressable>
  );
};

export const ClientsList: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const debouncedSearch = useDebounce(searchText, 300);
  
  const { useClientsList, createClient } = useClientsController();
  const { data, isLoading, refetch, isRefetching } = useClientsList({
    search: debouncedSearch,
    activeOnly: false,
  });

  const handleClientPress = (clientId: string) => {
    router.push(`/clients/${clientId}`);
  };

  const handleAddClient = () => {
    router.push('/clients/create');
  };

  const renderEmptyState = () => (
    <VStack className="flex-1 items-center justify-center p-8">
      <Text className="text-gray-500 text-center mb-4">
        {searchText ? 'No se encontraron clientes' : 'No hay clientes registrados'}
      </Text>
      {!searchText && (
        <Button onPress={handleAddClient} className="bg-blue-600">
          <Icon as={UserPlusIcon} className="text-white mr-2" />
          <ButtonText>Agregar primer cliente</ButtonText>
        </Button>
      )}
    </VStack>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Search bar */}
      <View className="px-4 py-3 bg-white border-b border-gray-200">
        <Input className="bg-gray-50">
          <InputSlot className="pl-3">
            <InputIcon as={SearchIcon} className="text-gray-400" />
          </InputSlot>
          <InputField
            placeholder="Buscar por nombre, email o teléfono..."
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
          />
        </Input>
      </View>

      {/* Clients list */}
      {isLoading ? (
        <VStack className="flex-1 items-center justify-center">
          <Spinner className="text-blue-600" />
          <Text className="text-gray-600 mt-2">Cargando clientes...</Text>
        </VStack>
      ) : (
        <FlatList
          data={data?.clients || []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ClientCard 
              client={item} 
              onPress={() => handleClientPress(item.id)}
            />
          )}
          contentContainerStyle={{ 
            padding: 16,
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}

      {/* FAB for adding client */}
      {data?.clients && data.clients.length > 0 && (
        <View className="absolute bottom-6 right-6">
          <Button
            onPress={handleAddClient}
            className="bg-blue-600 rounded-full w-14 h-14 items-center justify-center shadow-lg"
          >
            <Icon as={UserPlusIcon} className="text-white" />
          </Button>
        </View>
      )}
    </View>
  );
};