import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface ProductDetailStore {
  // State
  isEditing: boolean;
  showStockAdjustment: boolean;
  stockAdjustment: number;
  
  // Actions
  setIsEditing: (isEditing: boolean) => void;
  setShowStockAdjustment: (show: boolean) => void;
  setStockAdjustment: (value: number) => void;
  incrementStock: () => void;
  decrementStock: () => void;
  resetStockAdjustment: () => void;
  reset: () => void;
}

const initialState = {
  isEditing: false,
  showStockAdjustment: false,
  stockAdjustment: 0,
};

export const useProductDetailStore = create<ProductDetailStore>()(
  devtools(
    (set) => ({
      // Initial state
      ...initialState,

      // Actions
      setIsEditing: (isEditing) => set({ isEditing }),
      
      setShowStockAdjustment: (show) => 
        set({ 
          showStockAdjustment: show,
          stockAdjustment: show ? 0 : 0 // Reset when hiding
        }),
      
      setStockAdjustment: (value) => set({ stockAdjustment: value }),
      
      incrementStock: () => 
        set((state) => ({ 
          stockAdjustment: state.stockAdjustment + 1 
        })),
      
      decrementStock: () => 
        set((state) => ({ 
          stockAdjustment: state.stockAdjustment - 1 
        })),
      
      resetStockAdjustment: () => 
        set({ 
          stockAdjustment: 0,
          showStockAdjustment: false 
        }),
      
      reset: () => set(initialState),
    }),
    {
      name: 'product-detail-store',
    }
  )
);