import React from 'react';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { View } from 'react-native';
import { ScreenForm } from '@/shared/components/ScreenForm';
import { useNewSale } from '@/features/sales/hooks/useNewSale';
import {
  EmptyCart,
  CartItemList,
  SaleDetailsForm,
  SaleTotalFooter,
} from '@/features/sales/components';

export default function NewSaleScreen() {
  const { hasItems, itemCount } = useNewSale();

  return (
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
  );
}