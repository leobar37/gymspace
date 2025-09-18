import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';
import { useDataSearch } from '@/hooks/useDataSearch';
import { InputSearch } from '@/shared/input-search';
import BottomSheet, { 
  BottomSheetBackdrop, 
  BottomSheetView,
  BottomSheetFlatList,
  BottomSheetFooter,
  BottomSheetFooterProps
} from '@gorhom/bottom-sheet';
import type { Product } from '@gymspace/sdk';
import { CheckIcon, XIcon } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNewSale } from '../../hooks/useNewSale';
import { ItemGrid } from './ItemGrid';
import { ItemTabs } from './ItemTabs';
import { QuantityControlFooter } from './QuantityControlFooter';

export const ItemSelectionModal: React.FC = () => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
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
    itemCount,
    lastSelectedProductId,
    items,
    openItemSelection,
  } = useNewSale();

  // Get current items based on selected tab
  const currentItems = selectedTab === 'products' ? products : services;
  const isLoading = selectedTab === 'products' ? loadingProducts : loadingServices;

  // Setup search for current items
  const { searchInput, setSearchInput, filteredData, clearSearch } = useDataSearch<Product>({
    data: currentItems,
    searchFields: (item) => [item.name || '', item.description || ''],
    searchPlaceholder: `Buscar ${selectedTab === 'products' ? 'productos' : 'servicios'}...`,
  });

  // Find the last selected product
  const lastSelectedProduct = useMemo(() => {
    if (!lastSelectedProductId) return undefined;

    // Look in both products and services
    const allItems = [...products, ...services];
    return allItems.find((item) => item.id === lastSelectedProductId);
  }, [lastSelectedProductId, products, services]);

  // Handle closing the sheet
  const handleClose = useCallback(() => {
    clearSearch();
    closeItemSelection();
    bottomSheetRef.current?.close();
  }, [clearSearch, closeItemSelection]);

  // Handle opening the sheet when showItemSelection changes
  useEffect(() => {
    if (showItemSelection) {
      bottomSheetRef.current?.snapToIndex(1);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [showItemSelection]);

  // Render backdrop
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    [],
  );

  // Handle tab change
  const handleTabChange = (tab: 'products' | 'services') => {
    setSelectedTab(tab);
    clearSearch(); // Clear search when changing tabs
  };

  // Render footer with quantity control and confirmation button
  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheetFooter {...props}>
        <View style={styles.footerContainer}>
          {/* Quantity Control */}
          {lastSelectedProduct && (
            <QuantityControlFooter product={lastSelectedProduct} />
          )}
          
          {/* Confirmation Button */}
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <Button onPress={handleClose} variant="solid" size="lg" className="w-full">
              <HStack space="sm" className="items-center">
                <Icon as={CheckIcon} className="w-5 h-5 text-white" />
                <ButtonText className="font-semibold">
                  Confirmar selección {itemCount > 0 && `(${itemCount} items)`}
                </ButtonText>
              </HStack>
            </Button>
          </View>
        </View>
      </BottomSheetFooter>
    ),
    [handleClose, itemCount, insets.bottom, lastSelectedProduct]
  );

  if (!showItemSelection) {
    return null;
  }

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={['25%', '100%']}
      index={1}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handleIndicator}
      onClose={() => closeItemSelection()}
      footerComponent={renderFooter}
    >
      <BottomSheetView style={styles.contentContainer}>
        {/* Modal Header */}
        <HStack className="justify-between items-center p-4 border-b border-gray-200">
          <Text className="text-lg font-semibold text-gray-900">Seleccionar Producto</Text>
          <Pressable
            onPress={handleClose}
            className="w-8 h-8 items-center justify-center rounded-full bg-gray-100"
          >
            <Icon as={XIcon} className="w-5 h-5 text-gray-600" />
          </Pressable>
        </HStack>

        {/* Search Input */}
        <View className="px-4 py-3 border-b border-gray-100">
          <InputSearch
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder={`Buscar ${selectedTab === 'products' ? 'productos' : 'servicios'}...`}
            onClear={clearSearch}
            isSheet={true}
          />
        </View>

        {/* Tabs */}
        <ItemTabs selectedTab={selectedTab} onTabChange={handleTabChange} />

        {/* Scrollable Content */}
        <View style={styles.scrollView}>
          <ItemGrid
            items={filteredData || currentItems}
            type={selectedTab}
            loading={isLoading}
            onItemPress={addItem}
            isInBottomSheet={true}
          />
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollView: {
    flex: 1,
  },
  handleIndicator: {
    backgroundColor: '#E5E7EB',
  },
  footerContainer: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: 'white',
  },
});
