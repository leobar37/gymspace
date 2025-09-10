import { create } from 'zustand';
import type { ItemTab } from '../types';

interface SaleUIStore {
  // State
  isProcessing: boolean;
  error: Error | null;
  showItemSelection: boolean;
  selectedTab: ItemTab;
  lastSelectedProductId: string | null;
  
  // Actions
  setProcessing: (processing: boolean) => void;
  setError: (error: Error | null) => void;
  setShowItemSelection: (show: boolean) => void;
  setSelectedTab: (tab: ItemTab) => void;
  setLastSelectedProduct: (productId: string | null) => void;
  openItemSelection: () => void;
  closeItemSelection: () => void;
  reset: () => void;
}

const initialState = {
  isProcessing: false,
  error: null,
  showItemSelection: false,
  selectedTab: 'products' as ItemTab,
  lastSelectedProductId: null as string | null,
};

export const useSaleUIStore = create<SaleUIStore>((set) => ({
  ...initialState,
  
  setProcessing: (processing) => set({ isProcessing: processing }),
  
  setError: (error) => set({ error }),
  
  setShowItemSelection: (show) => set({ showItemSelection: show }),
  
  setSelectedTab: (tab) => set({ selectedTab: tab }),
  
  setLastSelectedProduct: (productId) => set({ lastSelectedProductId: productId }),
  
  openItemSelection: () => set({ showItemSelection: true }),
  
  closeItemSelection: () => set({ showItemSelection: false, lastSelectedProductId: null }),
  
  reset: () => set(initialState),
}));