import React from 'react';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { ScreenForm } from '@/shared/components/ScreenForm';
import { NewSaleProvider } from '@/features/sales/context/NewSaleProvider';
import { useNewSale } from '@/features/sales/hooks/useNewSale';
import {
  EmptyCart,
  CartItemList,
  SaleDetailsForm,
  SaleTotalFooter,
  ItemSelectionModal,
} from '@/features/sales/components';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View } from 'react-native';
// Inner component that uses the hook
function NewSaleContent() {
  const { hasItems, itemCount } = useNewSale();

  return (
    <>
      <ScreenForm
        useSafeArea={false}
        showBackButton={false}
        showFixedFooter={hasItems}
        footerContent={hasItems && <SaleTotalFooter />}
      >
        <VStack space="md" className="pb-16">
          {/* Cart Items */}
          <View>{hasItems ? <CartItemList /> : <EmptyCart />}</View>
          {/* Sale Details Form */}
          {hasItems && <SaleDetailsForm />}
        </VStack>
      </ScreenForm>

      {/* Item Selection Modal */}
      <ItemSelectionModal />
    </>
  );
}

// Main component with provider
export default function NewSaleScreen() {
  return (
    <NewSaleProvider>
      <GestureHandlerRootView>
        <BottomSheetModalProvider>
          <NewSaleContent />
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </NewSaleProvider>
  );
}
