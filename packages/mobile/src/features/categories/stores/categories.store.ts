import { create } from 'zustand';
import { ProductCategory } from '@gymspace/sdk';

interface CategoriesState {
  // State
  selectedCategory: ProductCategory | null;
  isDeleteDialogOpen: boolean;
  categoryToDelete: ProductCategory | null;
  
  // Actions
  setSelectedCategory: (category: ProductCategory | null) => void;
  openDeleteDialog: (category: ProductCategory) => void;
  closeDeleteDialog: () => void;
  clearSelection: () => void;
}

export const useCategoriesStore = create<CategoriesState>((set) => ({
  // Initial state
  selectedCategory: null,
  isDeleteDialogOpen: false,
  categoryToDelete: null,
  
  // Actions
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  
  openDeleteDialog: (category) => set({ 
    isDeleteDialogOpen: true, 
    categoryToDelete: category 
  }),
  
  closeDeleteDialog: () => set({ 
    isDeleteDialogOpen: false, 
    categoryToDelete: null 
  }),
  
  clearSelection: () => set({ 
    selectedCategory: null,
    isDeleteDialogOpen: false,
    categoryToDelete: null
  }),
}));