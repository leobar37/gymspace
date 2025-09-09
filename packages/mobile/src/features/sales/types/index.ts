import type { Product, Client } from '@gymspace/sdk';

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface SaleFormData {
  clientId?: string;
  notes?: string;
  fileIds?: string[];
  paymentMethodId?: string;
}

export type PaymentStatus = 'paid' | 'unpaid';

export type ItemTab = 'products' | 'services';