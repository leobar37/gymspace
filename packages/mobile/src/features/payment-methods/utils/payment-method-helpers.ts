import type { PaymentMethod } from '@gymspace/sdk';
import {
  BanknoteIcon,
  SmartphoneIcon,
  CreditCardIcon,
} from 'lucide-react-native';
import { PAYMENT_METHOD_TYPES } from '../constants';

export function getPaymentMethodIcon(paymentMethod: PaymentMethod) {
  const type = paymentMethod.metadata?.type;
  switch (type) {
    case PAYMENT_METHOD_TYPES.CASH:
      return BanknoteIcon;
    case PAYMENT_METHOD_TYPES.MOBILE:
      return SmartphoneIcon;
    case PAYMENT_METHOD_TYPES.CARD:
      return CreditCardIcon;
    default:
      return CreditCardIcon;
  }
}

export function getPaymentMethodColor(code: string) {
  switch (code) {
    case 'cash':
      return 'bg-emerald-50 text-emerald-600';
    case 'yape':
      return 'bg-purple-50 text-purple-600';
    case 'plin':
      return 'bg-blue-50 text-blue-600';
    case 'card':
      return 'bg-green-50 text-green-600';
    default:
      return 'bg-primary-50 text-primary-600';
  }
}