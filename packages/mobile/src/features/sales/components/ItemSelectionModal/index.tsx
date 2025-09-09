import React from 'react';
import { Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { XIcon } from 'lucide-react-native';
import { useNewSale } from '../../hooks/useNewSale';
import { ItemTabs } from './ItemTabs';
import { ItemGrid } from './ItemGrid';

export const ItemSelectionModal: React.FC = () => {
  const {
    showItemSelection,
    selectedTab,
    setSelectedTab,
    closeItemSelection,
    products,
    services,
    loadingProducts,
    loadingServices,
    addItem,
  } = useNewSale();

  return (
    <Modal 
      visible={showItemSelection} 
      animationType="slide" 
      presentationStyle="pageSheet"
    >
      <SafeAreaView className="flex-1 bg-white">
        <VStack className="flex-1">
          {/* Modal Header */}
          <HStack className="justify-between items-center p-4 border-b border-gray-200">
            <Text className="text-lg font-semibold text-gray-900">
              Seleccionar {selectedTab === 'products' ? 'Producto' : 'Servicio'}
            </Text>
            <Pressable
              onPress={closeItemSelection}
              className="w-8 h-8 items-center justify-center rounded-full bg-gray-100"
            >
              <Icon as={XIcon} className="w-5 h-5 text-gray-600" />
            </Pressable>
          </HStack>

          {/* Tabs */}
          <ItemTabs selectedTab={selectedTab} onTabChange={setSelectedTab} />

          {/* Content */}
          <View className="flex-1">
            {selectedTab === 'products' ? (
              <ItemGrid
                items={products}
                type="products"
                loading={loadingProducts}
                onItemPress={addItem}
              />
            ) : (
              <ItemGrid
                items={services}
                type="services"
                loading={loadingServices}
                onItemPress={addItem}
              />
            )}
          </View>
        </VStack>
      </SafeAreaView>
    </Modal>
  );
};