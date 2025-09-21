import { create } from 'zustand';
import type { ItemTab } from '../types';

interface SaleUIStore {
  // State
  isProcessing: boolean;
  error: Error | null;
  selectedTab: ItemTab;
  lastSelectedProductId: string | null;
  
  // Actions
  setProcessing: (processing: boolean) => void;
  setError: (error: Error | null) => void;
  setSelectedTab: (tab: ItemTab) => void;
  setLastSelectedProduct: (productId: string | null) => void;
  reset: () => void;
}

const initialState = {
  isProcessing: false,
  error: null,
  selectedTab: 'products' as ItemTab,
  lastSelectedProductId: null as string | null,
};

export const useSaleUIStore = create<SaleUIStore>((set) => ({
  ...initialState,
  
  setProcessing: (processing) => set({ isProcessing: processing }),
  
  setError: (error) => set({ error }),
  
  setSelectedTab: (tab) => set({ selectedTab: tab }),
  
  setLastSelectedProduct: (productId) => set({ lastSelectedProductId: productId }),
  
  reset: () => set(initialState),
}));