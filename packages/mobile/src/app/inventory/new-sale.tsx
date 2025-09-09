import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { ScreenForm } from '@/shared/components/ScreenForm';
import { NewSaleProvider } from '@/features/sales/context/NewSaleProvider';
import { useNewSale } from '@/features/sales/hooks/useNewSale';
import { 
  SaleHeader,
  CartSummary,
  EmptyCart,
  CartItemList,
  SaleDetailsForm,
  SaleTotalFooter,
  ItemSelectionModal,
} from '@/features/sales/components';

// Inner component that uses the hook
function NewSaleContent() {
  const { hasItems } = useNewSale();

  return (
    <>
      <ScreenForm
        useSafeArea={false}
        showBackButton={false}
        showFixedFooter={hasItems}
        footerContent={hasItems && <SaleTotalFooter />}
      >
        <VStack space="md" className="pb-16">
          {/* Header */}
          <SaleHeader />

          {/* Cart Summary */}
          <CartSummary />

          {/* Cart Items */}
          <VStack space="sm">
            <Text className="text-lg font-semibold text-gray-900">Items</Text>
            {hasItems ? <CartItemList /> : <EmptyCart />}
          </VStack>

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
      <SafeAreaView className="flex-1 bg-gray-50">
        <NewSaleContent />
      </SafeAreaView>
    </NewSaleProvider>
  );
}