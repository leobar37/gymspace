import { atom } from 'jotai';
import { Client } from '@gymspace/sdk';

// Store the selected client for check-in
export const selectedClientAtom = atom<Client | null>(null);

// Store the search query
export const checkInSearchQueryAtom = atom<string>('');

// Store notes for the check-in
export const checkInNotesAtom = atom<string>('');

// Derived atom to check if form is ready
export const checkInFormReadyAtom = atom(
  (get) => {
    const selectedClient = get(selectedClientAtom);
    return selectedClient !== null;
  }
);

// Derived atom to check if client can check in
export const canClientCheckInAtom = atom(
  (get) => {
    const client = get(selectedClientAtom);
    
    if (!client) {
      return { canCheckIn: false, reason: 'No client selected' };
    }

    // Check if client is active
    if (client.status !== 'active') {
      return { 
        canCheckIn: false, 
        reason: 'Client is inactive' 
      };
    }

    // Check if client has active contracts
    if (!client.contracts || client.contracts.length === 0) {
      return { 
        canCheckIn: false, 
        reason: 'No active membership' 
      };
    }

    // Check if any contract is valid
    const now = new Date();
    const hasValidContract = client.contracts.some(contract => {
      if (contract.status !== 'active') return false;
      
      const startDate = new Date(contract.startDate);
      const endDate = new Date(contract.endDate);
      
      return now >= startDate && now <= endDate;
    });

    if (!hasValidContract) {
      return { 
        canCheckIn: false, 
        reason: 'Membership expired' 
      };
    }

    return { canCheckIn: true };
  }
);

// Store for check-in history filter
export const checkInHistoryFilterAtom = atom({
  startDate: null as string | null,
  endDate: null as string | null,
  clientId: null as string | null,
});

// Reset form atom
export const resetCheckInFormAtom = atom(
  null,
  (get, set) => {
    set(selectedClientAtom, null);
    set(checkInSearchQueryAtom, '');
    set(checkInNotesAtom, '');
  }
);