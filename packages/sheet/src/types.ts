import type { BottomSheetModal, BottomSheetModalProps } from '@gorhom/bottom-sheet';
import type { ReactNode, RefObject } from 'react';

export interface SheetConfig {
  id: string;
  component: React.ComponentType<any>;
  options?: Partial<BottomSheetModalProps>;
}

export interface SheetManagerType {
  register: (id: string, component: React.ComponentType<any>, options?: Partial<BottomSheetModalProps>) => void;
  unregister: (id: string) => void;
  show: (id: string, props?: any) => void;
  hide: (id: string) => void;
  hideAll: () => void;
  isRegistered: (id: string) => boolean;
  setRef: (id: string, ref: RefObject<BottomSheetModal>) => void;
  getRef: (id: string) => RefObject<BottomSheetModal> | undefined;
}

export interface BottomSheetWrapperProps extends Omit<BottomSheetModalProps, 'children'> {
  children?: any;
  scrollable?: boolean;
  sheetId?: string;
  onShow?: () => void;
  onHide?: () => void;
}

export interface SheetProviderProps {
  children: ReactNode;
}

export interface SheetContextType {
  sheets: Map<string, SheetConfig>;
  refs: Map<string, RefObject<BottomSheetModal>>;
  show: (id: string, props?: any) => void;
  hide: (id: string) => void;
  hideAll: () => void;
}

export type SheetProps<T = any> = T & {
  sheetRef?: RefObject<BottomSheetModal>;
  onDismiss?: () => void;
};