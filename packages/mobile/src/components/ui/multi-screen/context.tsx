import { createContext, useContext } from 'react';
import { MultiScreenContextValue } from './types';

export const MultiScreenContext = createContext<MultiScreenContextValue | null>(null);

export function useMultiScreenContext(): MultiScreenContextValue {
  const context = useContext(MultiScreenContext);
  if (!context) {
    throw new Error('useMultiScreenContext must be used within a MultiScreen component');
  }
  return context;
}