import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { PaymentMethod } from '@gymspace/sdk';
import { createDisclosureStore } from '@/utils/disclosure-store';

// Business logic state - only payment method related data
interface PaymentMethodSelectorState {
  searchQuery: string;
  tempValue: string;
  selectedPaymentMethod: PaymentMethod | null;
  detailsPaymentMethod: PaymentMethod | null;
}

interface PaymentMethodSelectorActions {
  // Simple state updates using patch
  patch: (state: Partial<PaymentMethodSelectorState>) => void;
  
  // Selection actions
  selectPaymentMethod: (paymentMethodId: string) => void;
  clearSelection: () => void;
  confirmSelection: (
    paymentMethods: PaymentMethod[],
    onSelect?: (paymentMethod: PaymentMethod | null) => void
  ) => void;
  
  // Details modal data
  setDetailsPaymentMethod: (paymentMethod: PaymentMethod | null) => void;
  
  // Initialize temp value when opening modal
  initializeTempValue: (currentValue: string) => void;
  
  // Reset search query
  resetSearchQuery: () => void;
}

export type PaymentMethodSelectorStore = PaymentMethodSelectorState & PaymentMethodSelectorActions;

// Business logic store - clean of modal state
export const usePaymentMethodSelectorStore = create<PaymentMethodSelectorStore>()(
  immer((set) => ({
    // Initial state
    searchQuery: '',
    tempValue: '',
    selectedPaymentMethod: null,
    detailsPaymentMethod: null,

    // Simple patch method for state updates
    patch: (updates) =>
      set((state) => {
        Object.assign(state, updates);
      }),

    // Select a payment method temporarily
    selectPaymentMethod: (paymentMethodId) =>
      set((state) => {
        state.tempValue = paymentMethodId;
      }),

    // Clear selection
    clearSelection: () =>
      set((state) => {
        state.selectedPaymentMethod = null;
        state.tempValue = '';
      }),

    // Confirm selection
    confirmSelection: (paymentMethods, onSelect) =>
      set((state) => {
        const selected = paymentMethods.find((pm) => pm.id === state.tempValue);
        state.selectedPaymentMethod = selected || null;
        state.searchQuery = '';
        
        // Call the callback after state update
        if (onSelect) {
          onSelect(selected || null);
        }
      }),
    
    // Set details payment method
    setDetailsPaymentMethod: (paymentMethod) =>
      set((state) => {
        state.detailsPaymentMethod = paymentMethod;
      }),
    
    // Initialize temp value when opening modal
    initializeTempValue: (currentValue) =>
      set((state) => {
        state.tempValue = currentValue || '';
        state.searchQuery = '';
      }),
    
    // Reset search query
    resetSearchQuery: () =>
      set((state) => {
        state.searchQuery = '';
      }),
  }))
);

// Create separate modal disclosure stores
export const usePaymentMethodMainModal = createDisclosureStore();
export const usePaymentMethodDetailsModal = createDisclosureStore();