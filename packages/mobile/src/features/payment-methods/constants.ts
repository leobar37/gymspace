import type { PaymentMethodOption } from './schemas';

// Predefined payment methods for Peru
export const PREDEFINED_PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    name: 'Efectivo',
    code: 'cash',
    description: 'Pagos en efectivo para membresías y productos',
    enabled: true,
    metadata: {
      type: 'cash_payment',
      country: 'PE',
    },
  },
  {
    name: 'Yape',
    code: 'yape',
    description: 'Pago móvil con Yape',
    enabled: true,
    metadata: {
      type: 'mobile_payment',
      country: 'PE',
      phoneNumber: '', // Will be filled by the gym
      accountName: '', // Will be filled by the gym
      qrImageId: '', // Optional QR code image
    },
  },
  {
    name: 'Plin',
    code: 'plin',
    description: 'Pago móvil con Plin',
    enabled: true,
    metadata: {
      type: 'mobile_payment',
      country: 'PE',
      phoneNumber: '', // Will be filled by the gym
      accountName: '', // Will be filled by the gym
      qrImageId: '', // Optional QR code image
    },
  },
  {
    name: 'Tarjeta',
    code: 'card',
    description: 'Pago con tarjeta de crédito o débito',
    enabled: true,
    metadata: {
      type: 'card_payment',
      country: 'PE',
    },
  },
];

// Payment method codes
export const PAYMENT_METHOD_CODES = {
  CASH: 'cash',
  YAPE: 'yape',
  PLIN: 'plin',
  CARD: 'card',
  CUSTOM: 'custom',
} as const;

// Payment method types
export const PAYMENT_METHOD_TYPES = {
  CASH: 'cash_payment',
  MOBILE: 'mobile_payment',
  CARD: 'card_payment',
  CUSTOM: 'custom_payment',
} as const;

// Get payment method icon based on type
export const getPaymentMethodIcon = (type: string) => {
  switch (type) {
    case PAYMENT_METHOD_TYPES.CASH:
      return 'BanknoteIcon';
    case PAYMENT_METHOD_TYPES.MOBILE:
      return 'SmartphoneIcon';
    case PAYMENT_METHOD_TYPES.CARD:
      return 'CreditCardIcon';
    default:
      return 'PlusIcon';
  }
};

// Get payment method color classes based on code
export const getPaymentMethodColor = (code: string) => {
  switch (code) {
    case PAYMENT_METHOD_CODES.CASH:
      return 'bg-emerald-100 text-emerald-600';
    case PAYMENT_METHOD_CODES.YAPE:
      return 'bg-purple-100 text-purple-600';
    case PAYMENT_METHOD_CODES.PLIN:
      return 'bg-blue-100 text-blue-600';
    case PAYMENT_METHOD_CODES.CARD:
      return 'bg-green-100 text-green-600';
    default:
      return 'bg-primary-100 text-primary-600';
  }
};
