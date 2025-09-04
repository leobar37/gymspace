import React from 'react';
import { PaymentMethodsList } from '@/features/payment-methods/components/PaymentMethodsList';
import { SafeAreaView } from 'react-native';

export default function PaymentMethodsScreen() {
  return (
    <SafeAreaView>
      <PaymentMethodsList />
    </SafeAreaView>
  );
}
