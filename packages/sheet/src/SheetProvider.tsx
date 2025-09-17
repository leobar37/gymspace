import React, { createContext, useContext, useRef, useCallback } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider, BottomSheetModal } from '@gorhom/bottom-sheet';
import type { SheetProviderProps, SheetContextType, SheetConfig } from './types';

const SheetContext = createContext<SheetContextType | null>(null);

export const useSheetContext = () => {
  const context = useContext(SheetContext);
  if (!context) {
    throw new Error('useSheetContext must be used within SheetProvider');
  }
  return context;
};

export function SheetProvider({ children }: SheetProviderProps) {
  const sheetsRef = useRef<Map<string, SheetConfig>>(new Map());
  const refsRef = useRef<Map<string, React.RefObject<BottomSheetModal>>>(new Map());

  const show = useCallback((id: string, props?: any) => {
    const ref = refsRef.current.get(id);
    if (ref?.current) {
      ref.current.present(props);
    } else {
      console.warn(`Sheet with id "${id}" not found or not registered`);
    }
  }, []);

  const hide = useCallback((id: string) => {
    const ref = refsRef.current.get(id);
    if (ref?.current) {
      ref.current.dismiss();
    } else {
      console.warn(`Sheet with id "${id}" not found`);
    }
  }, []);

  const hideAll = useCallback(() => {
    refsRef.current.forEach((ref) => {
      if (ref.current) {
        ref.current.dismiss();
      }
    });
  }, []);

  const contextValue: SheetContextType = {
    sheets: sheetsRef.current,
    refs: refsRef.current,
    show,
    hide,
    hideAll,
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <SheetContext.Provider value={contextValue}>
          {children}
        </SheetContext.Provider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}