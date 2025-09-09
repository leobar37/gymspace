import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Product } from '@gymspace/sdk';
import type { CartItem } from '../types';

interface CartStore {
  // State
  items: CartItem[];
  
  // Actions
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  
  // Computed getters
  getTotal: () => number;
  getItemCount: () => number;
  hasItems: () => boolean;
}

export const useCartStore = create<CartStore>()(
  immer((set, get) => ({
    items: [],
    
    addItem: (product, quantity) => set((state) => {
      const existingItem = state.items.find(
        item => item.product.id === product.id
      );
      
      if (existingItem) {
        // Update quantity if item already exists
        existingItem.quantity += quantity;
        existingItem.total = existingItem.unitPrice * existingItem.quantity;
      } else {
        // Add new item to cart
        const unitPrice = product.price;
        state.items.push({
          product,
          quantity,
          unitPrice,
          total: unitPrice * quantity,
        });
      }
    }),
    
    removeItem: (productId) => set((state) => {
      const index = state.items.findIndex(
        item => item.product.id === productId
      );
      if (index !== -1) {
        state.items.splice(index, 1);
      }
    }),
    
    updateQuantity: (productId, quantity) => set((state) => {
      const item = state.items.find(
        item => item.product.id === productId
      );
      if (item) {
        if (quantity <= 0) {
          // Remove item if quantity is 0 or less
          const index = state.items.indexOf(item);
          state.items.splice(index, 1);
        } else {
          item.quantity = quantity;
          item.total = item.unitPrice * quantity;
        }
      }
    }),
    
    clearCart: () => set((state) => {
      state.items = [];
    }),
    
    // Computed getters
    getTotal: () => {
      const items = get().items;
      return items.reduce((sum, item) => 
        sum + (item.unitPrice * item.quantity), 0
      );
    },
    
    getItemCount: () => {
      const items = get().items;
      return items.reduce((sum, item) => 
        sum + item.quantity, 0
      );
    },
    
    hasItems: () => {
      return get().items.length > 0;
    },
  }))
);