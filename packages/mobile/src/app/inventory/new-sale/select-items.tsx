import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { View } from '@/components/ui/view';
import { ItemGrid } from '@/features/sales/components/ItemSelectionModal/ItemGrid';
import { ItemTabs } from '@/features/sales/components/ItemSelectionModal/ItemTabs';
import { QuantityControlFooter } from '@/features/sales/components/ItemSelectionModal/QuantityControlFooter';
import { useNewSale } from '@/features/sales/hooks/useNewSale';
import { useDataSearch } from '@/hooks/useDataSearch';
import { InputSearch } from '@/shared/input-search';
import type { Product } from '@gymspace/sdk';
import { useRouter } from 'expo-router';
import { CheckIcon } from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SelectItemsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    selectedTab,
    setSelectedTab,
    products,
    services,
    loadingProducts,
    loadingServices,
    addItem,
    itemCount,
    lastSelectedProductId,
  } = useNewSale();

  const currentItems = selectedTab === 'products' ? products : services;
  const isLoading = selectedTab === 'products' ? loadingProducts : loadingServices;

  const { searchInput, setSearchInput, filteredData, clearSearch } = useDataSearch<Product>({
    data: currentItems,
    searchFields: (item) => [item.name || '', item.description || ''],
    searchPlaceholder: `Buscar ${selectedTab === 'products' ? 'productos' : 'servicios'}...`,
  });

  const lastSelectedProduct = useMemo(() => {
    if (!lastSelectedProductId) return undefined;

    const allItems = [...products, ...services];
    return allItems.find((item) => item.id === lastSelectedProductId);
  }, [lastSelectedProductId, products, services]);

  const handleConfirmSelection = useCallback(() => {
    clearSearch();
    router.back();
  }, [clearSearch, router]);

  const handleTabChange = (tab: 'products' | 'services') => {
    setSelectedTab(tab);
    clearSearch();
  };

  return (
    <View className="flex-1 bg-white">
      <View className="px-4 py-3 border-b border-gray-100">
        <InputSearch
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder={`Buscar ${selectedTab === 'products' ? 'productos' : 'servicios'}...`}
          onClear={clearSearch}
          isSheet={false}
        />
      </View>

      {/* Tabs */}
      <ItemTabs selectedTab={selectedTab} onTabChange={handleTabChange} />

      <ItemGrid
        items={filteredData || currentItems}
        type={selectedTab}
        loading={isLoading}
        onItemPress={addItem}
        isInBottomSheet={false}
      />

      <View className="bg-white border-t border-gray-200">
        {lastSelectedProduct && <QuantityControlFooter product={lastSelectedProduct} />}
        {/* Confirmation Button */}
        <View className="p-4" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
          <Button onPress={handleConfirmSelection} variant="solid" size="lg" className="w-full">
            <HStack space="sm" className="items-center">
              <Icon as={CheckIcon} className="w-5 h-5" />
              <ButtonText className="font-semibold">
                Confirmar selección {itemCount > 0 && `(${itemCount} items)`}
              </ButtonText>
            </HStack>
          </Button>
        </View>
      </View>
    </View>
  );
}
