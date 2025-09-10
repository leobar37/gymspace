import type { Product } from '@gymspace/sdk';

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type PaymentStatus = 'paid' | 'unpaid';

export type ItemTab = 'products' | 'services';