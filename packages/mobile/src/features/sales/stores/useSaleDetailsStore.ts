import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Client } from '@gymspace/sdk';
import type { PaymentStatus } from '../types';

export interface SaleDetails {
  client: Client | null;
  customerName: string;
  notes: string;
  paymentStatus: PaymentStatus;
  paymentMethodId: string | null;
  fileIds: string[];
}

interface SaleDetailsStore {
  // State
  details: SaleDetails;
  
  // Actions
  setSaleDetails: (details: Partial<SaleDetails>) => void;
  setClient: (client: Client | null) => void;
  reset: () => void;
}

const initialState: SaleDetails = {
  client: null,
  customerName: '',
  notes: '',
  paymentStatus: 'paid' as PaymentStatus,
  paymentMethodId: null,
  fileIds: [],
};

export const useSaleDetailsStore = create<SaleDetailsStore>()(
  immer((set) => ({
    details: initialState,
    
    setSaleDetails: (newDetails) => set((state) => {
      state.details = { ...state.details, ...newDetails };
    }),
    
    setClient: (client) => set((state) => {
      state.details.client = client;
      // Automatically update customer name when client is selected
      state.details.customerName = client?.name || '';
    }),
    
    reset: () => set((state) => {
      state.details = initialState;
    }),
  }))
);