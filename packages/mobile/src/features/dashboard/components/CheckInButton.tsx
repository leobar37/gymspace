import React, { useState, useMemo } from 'react';
import { Pressable, View, Modal, ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Button, ButtonText } from '@/components/ui/button';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Card } from '@/components/ui/card';
import { Input, InputField } from '@/components/ui/input';
import { Heading } from '@/components/ui/heading';
import { Spinner } from '@/components/ui/spinner';
import { CheckCircleIcon, XIcon, SearchIcon, UserIcon } from 'lucide-react-native';
import { useCheckInForm } from '@/controllers/check-ins.controller';
import { useClientsController } from '@/features/clients/controllers/clients.controller';

export const CheckInButton: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientName, setSelectedClientName] = useState<string>('');
  const [notes, setNotes] = useState('');
  
  const { handleCheckIn, isLoading: isCheckingIn } = useCheckInForm();
  const { useClientsList } = useClientsController();
  
  // Only search when query is long enough
  const shouldSearch = useMemo(() => searchQuery.length > 2, [searchQuery]);
  
  // Search clients when typing
  const { data: searchResults, isLoading: isSearching } = useClientsList(
    shouldSearch ? {
      search: searchQuery,
      limit: 10,
    } : {
      limit: 0, // Return no results when not searching
    }
  );

  const handleCreateCheckIn = async () => {
    if (!selectedClientId) return;
    
    try {
      await handleCheckIn(selectedClientId, notes.trim() || undefined);
      // Reset form and close modal on success
      setSelectedClientId(null);
      setSelectedClientName('');
      setSearchQuery('');
      setNotes('');
      setIsModalVisible(false);
    } catch (error) {
      // Error is handled by the controller with toast
    }
  };

  const openModal = () => setIsModalVisible(true);
  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedClientId(null);
    setSelectedClientName('');
    setSearchQuery('');
    setNotes('');
  };

  return (
    <>
      {/* Floating Action Button */}
      <Pressable
        onPress={openModal}
        className="absolute bottom-6 right-6 w-14 h-14 bg-green-600 rounded-full items-center justify-center shadow-lg"
        style={{
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 5,
        }}
      >
        <Icon as={CheckCircleIcon} className="w-7 h-7 text-white" />
      </Pressable>

      {/* Check-in Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl min-h-[70%]">
            {/* Modal Header */}
            <VStack className="p-6 border-b border-gray-200">
              <HStack className="justify-between items-center">
                <Heading className="text-xl font-bold text-gray-900">
                  Registrar Check-in
                </Heading>
                <Pressable onPress={closeModal} className="p-2">
                  <Icon as={XIcon} className="w-6 h-6 text-gray-600" />
                </Pressable>
              </HStack>
            </VStack>

            {/* Modal Content */}
            <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
              <VStack className="gap-6">
                {/* Search Input */}
                <VStack className="gap-2">
                  <Text className="text-sm font-medium text-gray-700">
                    Buscar Cliente
                  </Text>
                  <View className="relative">
                    <Input variant="outline" size="md">
                      <Icon as={SearchIcon} className="absolute left-3 top-3 w-5 h-5 text-gray-400 z-10" />
                      <InputField
                        placeholder="Buscar por nombre o email..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        className="pl-10"
                      />
                    </Input>
                  </View>
                </VStack>

                {/* Search Results */}
                {searchQuery.length > 2 && (
                  <VStack className="gap-2">
                    {isSearching ? (
                      <HStack className="items-center justify-center py-4">
                        <Spinner className="text-blue-600" />
                        <Text className="ml-2 text-gray-600">Buscando...</Text>
                      </HStack>
                    ) : searchResults?.data && searchResults.data.length > 0 ? (
                      <VStack className="gap-2">
                        {searchResults.data.map((client: any) => (
                          <Pressable
                            key={client.id}
                            onPress={() => {
                              setSelectedClientId(client.id);
                              const fullName = `${client.firstName || client.name || ''} ${client.lastName || ''}`.trim();
                              setSelectedClientName(fullName);
                              setSearchQuery(fullName);
                            }}
                          >
                            <Card className={`p-3 ${selectedClientId === client.id ? 'bg-green-50 border-green-500' : 'bg-white'}`}>
                              <HStack className="items-center gap-3">
                                <View className="w-10 h-10 bg-gray-200 rounded-full items-center justify-center">
                                  <Icon as={UserIcon} className="w-5 h-5 text-gray-600" />
                                </View>
                                <VStack className="flex-1">
                                  <Text className="font-medium text-gray-900">
                                    {client.firstName || client.name || ''} {client.lastName || ''}
                                  </Text>
                                  {client.email && (
                                    <Text className="text-xs text-gray-500">
                                      {client.email}
                                    </Text>
                                  )}
                                </VStack>
                                {selectedClientId === client.id && (
                                  <Icon as={CheckCircleIcon} className="w-5 h-5 text-green-600" />
                                )}
                              </HStack>
                            </Card>
                          </Pressable>
                        ))}
                      </VStack>
                    ) : (
                      <Text className="text-center text-gray-500 py-4">
                        No se encontraron clientes
                      </Text>
                    )}
                  </VStack>
                )}

                {/* Notes Input */}
                {selectedClientId && (
                  <VStack className="gap-2">
                    <Text className="text-sm font-medium text-gray-700">
                      Notas (opcional)
                    </Text>
                    <Input variant="outline" size="md">
                      <InputField
                        placeholder="Agregar una nota..."
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                      />
                    </Input>
                  </VStack>
                )}

                {/* Action Buttons */}
                <HStack className="gap-3 pt-4">
                  <Button
                    variant="outline"
                    size="md"
                    className="flex-1"
                    onPress={closeModal}
                  >
                    <ButtonText>Cancelar</ButtonText>
                  </Button>
                  <Button
                    variant="solid"
                    size="md"
                    className="flex-1 bg-green-600"
                    onPress={handleCreateCheckIn}
                    disabled={!selectedClientId || isCheckingIn}
                  >
                    {isCheckingIn ? (
                      <Spinner className="text-white" />
                    ) : (
                      <ButtonText className="text-white">
                        Registrar Check-in
                      </ButtonText>
                    )}
                  </Button>
                </HStack>
              </VStack>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};