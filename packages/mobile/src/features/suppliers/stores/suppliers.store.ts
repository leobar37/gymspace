import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface SuppliersStore {
  // State
  searchQuery: string;
  selectedSupplierId: string | null;
  isModalOpen: boolean;
  filters: {
    status: 'all' | 'active' | 'inactive';
    category: string | null;
  };

  // Actions
  setSearchQuery: (query: string) => void;
  setSelectedSupplierId: (id: string | null) => void;
  setModalOpen: (isOpen: boolean) => void;
  setFilters: (filters: Partial<SuppliersStore['filters']>) => void;
  resetFilters: () => void;
  
  // Modal actions
  openCreateModal: () => void;
  openEditModal: (supplierId: string) => void;
  closeModal: () => void;
}

const initialFilters = {
  status: 'all' as const,
  category: null,
};

export const useSuppliersStore = create<SuppliersStore>()(
  devtools(
    (set) => ({
      // Initial state
      searchQuery: '',
      selectedSupplierId: null,
      isModalOpen: false,
      filters: initialFilters,

      // Actions
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      setSelectedSupplierId: (id) => set({ selectedSupplierId: id }),
      
      setModalOpen: (isOpen) => set({ isModalOpen: isOpen }),
      
      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
        })),
      
      resetFilters: () => set({ filters: initialFilters }),
      
      // Modal actions
      openCreateModal: () =>
        set({
          isModalOpen: true,
          selectedSupplierId: null,
        }),
      
      openEditModal: (supplierId) =>
        set({
          isModalOpen: true,
          selectedSupplierId: supplierId,
        }),
      
      closeModal: () =>
        set({
          isModalOpen: false,
          selectedSupplierId: null,
        }),
    }),
    {
      name: 'suppliers-store',
    }
  )
);