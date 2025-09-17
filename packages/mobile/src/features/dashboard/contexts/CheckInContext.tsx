import React, { createContext, useContext, useReducer, useMemo, useCallback } from 'react';
import { useCheckInForm } from '@/features/dashboard/controllers/check-ins.controller';
import { useLoadingScreen } from '@/shared/loading-screen';
import { useClientsController } from '@/features/clients/controllers/clients.controller';
import { useDataSearch } from '@/hooks/useDataSearch';
import { SheetManager } from '@gymspace/sheet';
import type { Client } from '@gymspace/sdk';

// State interface
interface CheckInState {
  selectedClient: Client | null;
  notes: string;
}

// Actions interface
interface CheckInActions {
  // Client Management
  selectClient: (client: Client | null) => void;
  canClientCheckIn: (client: Client) => { canCheckIn: boolean; reason?: string };

  // Form Management
  setNotes: (notes: string) => void;
  resetForm: () => void;

  // Sheet Management
  openSheet: () => void;
  closeSheet: () => void;

  // Business Logic
  handleCreateCheckIn: () => Promise<void>;
}

// Computed properties interface
interface CheckInComputed {
  hasSelectedClient: boolean;
}

// Full context value
type CheckInContextValue = CheckInState & CheckInActions & CheckInComputed;

// Action types
type CheckInAction =
  | { type: 'SELECT_CLIENT'; payload: Client | null }
  | { type: 'SET_NOTES'; payload: string }
  | { type: 'RESET_FORM' };

// Initial state
const initialState: CheckInState = {
  selectedClient: null,
  notes: '',
};

// Reducer
const checkInReducer = (state: CheckInState, action: CheckInAction): CheckInState => {
  switch (action.type) {
    case 'SELECT_CLIENT':
      return { ...state, selectedClient: action.payload };
    case 'SET_NOTES':
      return { ...state, notes: action.payload };
    case 'RESET_FORM':
      return { ...state, selectedClient: null, notes: '' };
    default:
      return state;
  }
};

// Context
const CheckInContext = createContext<CheckInContextValue | null>(null);

// Provider component
interface CheckInProviderProps {
  children: React.ReactNode;
}

export const CheckInProvider: React.FC<CheckInProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(checkInReducer, initialState);

  // Hooks
  const { handleCheckIn } = useCheckInForm();
  const { execute } = useLoadingScreen();

  // Client validation logic
  const canClientCheckIn = useCallback((client: Client): { canCheckIn: boolean; reason?: string } => {
    // Check if client is active
    if (client.status !== 'active') {
      return {
        canCheckIn: false,
        reason: 'Cliente inactivo',
      };
    }

    // Check if client has active contracts
    if (!client.contracts || client.contracts.length === 0) {
      return {
        canCheckIn: false,
        reason: 'Sin membresía activa',
      };
    }

    // Check if any contract is valid
    const now = new Date();
    const hasValidContract = client.contracts.some((contract) => {
      if (contract.status !== 'active') return false;

      const startDate = new Date(contract.startDate);
      const endDate = new Date(contract.endDate);

      return now >= startDate && now <= endDate;
    });

    if (!hasValidContract) {
      return {
        canCheckIn: false,
        reason: 'Membresía expirada',
      };
    }

    return { canCheckIn: true };
  }, []);

  // Actions
  const selectClient = useCallback((client: Client | null) => {
    dispatch({ type: 'SELECT_CLIENT', payload: client });
  }, []);


  const setNotes = useCallback((notes: string) => {
    dispatch({ type: 'SET_NOTES', payload: notes });
  }, []);

  const resetForm = useCallback(() => {
    dispatch({ type: 'RESET_FORM' });
  }, []);

  const openSheet = useCallback(() => {
    resetForm();
    SheetManager.show('check-in');
  }, [resetForm]);

  const closeSheet = useCallback(() => {
    SheetManager.hide('check-in');
    resetForm();
  }, [resetForm]);

  const handleCreateCheckIn = useCallback(async () => {
    if (!state.selectedClient) return;

    await execute(handleCheckIn(state.selectedClient.id, state.notes.trim() || undefined), {
      action: 'Registrando check-in...',
      successMessage: `Check-in registrado exitosamente para ${state.selectedClient.name}`,
      errorFormatter: (error) => {
        if (error instanceof Error) {
          return error.message;
        }
        return 'Error al registrar check-in';
      },
      successActions: [
        {
          label: 'Nuevo Check-in',
          onPress: () => {
            resetForm();
          },
          variant: 'solid',
        },
      ],
      hideOnSuccess: false,
    });
  }, [state.selectedClient, state.notes, execute, handleCheckIn, resetForm]);

  // Computed properties
  const computed = useMemo(() => ({
    hasSelectedClient: Boolean(state.selectedClient),
  }), [state.selectedClient]);

  // Context value
  const contextValue = useMemo(() => ({
    ...state,
    selectClient,
    canClientCheckIn,
    setNotes,
    resetForm,
    openSheet,
    closeSheet,
    handleCreateCheckIn,
    ...computed,
  }), [
    state,
    selectClient,
    canClientCheckIn,
    setNotes,
    resetForm,
    openSheet,
    closeSheet,
    handleCreateCheckIn,
    computed,
  ]);

  return (
    <CheckInContext.Provider value={contextValue}>
      {children}
    </CheckInContext.Provider>
  );
};

// Custom hook for consuming context
export const useCheckIn = (): CheckInContextValue => {
  const context = useContext(CheckInContext);
  if (!context) {
    throw new Error('useCheckIn must be used within CheckInProvider');
  }
  return context;
};