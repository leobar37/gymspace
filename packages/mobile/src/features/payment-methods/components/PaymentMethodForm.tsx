import React from 'react';
import { VStack } from '@/components/ui/vstack';
import { CashPaymentForm, MobilePaymentForm, CardPaymentForm, CustomPaymentForm } from './forms';

interface PaymentMethodOption {
  name: string;
  code: string;
  description: string;
  enabled: boolean;
  metadata: {
    type: string;
    country: string;
  };
}

interface PaymentMethodFormProps {
  paymentMethod: PaymentMethodOption;
}

export const PaymentMethodForm: React.FC<PaymentMethodFormProps> = ({ paymentMethod }) => {
  console.log("paymentMethod", JSON.stringify(paymentMethod, null, 2));
  const renderForm = () => {
    const code = paymentMethod.code.toLowerCase();
    switch (code) {
      case 'cash':
        return <CashPaymentForm />;
      
      case 'yape':
        return <MobilePaymentForm paymentType="yape" />;
      
      case 'plin':
        return <MobilePaymentForm paymentType="plin" />;
      
      case 'card':
        return <CardPaymentForm />;
      
      case 'custom':
        return <CustomPaymentForm />;
      
      default:
        return <CustomPaymentForm />;
    }
  };

  return (
    <VStack space="lg" className="w-full">
      {renderForm()}
    </VStack>
  );
};