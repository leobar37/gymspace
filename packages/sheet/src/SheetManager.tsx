import type { RefObject } from 'react';
import type { BottomSheetModal, BottomSheetModalProps } from '@gorhom/bottom-sheet';
import type { SheetManagerType } from './types';

class SheetManagerClass implements SheetManagerType {
  private static instance: SheetManagerClass;
  private sheets = new Map<string, React.ComponentType<any>>();
  private options = new Map<string, Partial<BottomSheetModalProps>>();
  private refs = new Map<string, RefObject<BottomSheetModal>>();
  private activeProps = new Map<string, any>();
  private listeners = new Set<() => void>();

  private constructor() {}

  static getInstance(): SheetManagerClass {
    if (!SheetManagerClass.instance) {
      SheetManagerClass.instance = new SheetManagerClass();
    }
    return SheetManagerClass.instance;
  }

  register(id: string, component: React.ComponentType<any>, options?: Partial<BottomSheetModalProps>) {
    this.sheets.set(id, component);
    if (options) {
      this.options.set(id, options);
    }
  }

  unregister(id: string) {
    this.sheets.delete(id);
    this.options.delete(id);
    this.refs.delete(id);
    this.activeProps.delete(id);
  }

  setRef(id: string, ref: RefObject<BottomSheetModal>) {
    this.refs.set(id, ref);
  }

  getRef(id: string): RefObject<BottomSheetModal> | undefined {
    return this.refs.get(id);
  }

  show(id: string, props?: any) {
    const ref = this.refs.get(id);
    if (ref?.current) {
      this.activeProps.set(id, props);
      this.notifyListeners();
      ref.current.present();
    } else if (ref) {
      // Ref exists but current is null, set props and wait for mount
      this.activeProps.set(id, props);
      this.notifyListeners();
      // Try again after a short delay to allow component to mount
      setTimeout(() => {
        const updatedRef = this.refs.get(id);
        if (updatedRef?.current) {
          updatedRef.current.present();
        } else {
          console.warn(`Sheet with id "${id}" ref exists but component not mounted after timeout`);
        }
      }, 100);
    } else {
      console.warn(`Sheet with id "${id}" not found or not registered`);
    }
  }

  hide(id: string) {
    const ref = this.refs.get(id);
    if (ref?.current) {
      ref.current.dismiss();
      this.activeProps.delete(id);
    } else {
      console.warn(`Sheet with id "${id}" not found`);
    }
  }

  hideAll() {
    this.refs.forEach((ref, id) => {
      if (ref.current) {
        ref.current.dismiss();
        this.activeProps.delete(id);
      }
    });
  }

  isRegistered(id: string): boolean {
    return this.sheets.has(id);
  }

  getComponent(id: string): React.ComponentType<any> | undefined {
    return this.sheets.get(id);
  }

  getOptions(id: string): Partial<BottomSheetModalProps> | undefined {
    return this.options.get(id);
  }

  getProps(id: string): any {
    return this.activeProps.get(id);
  }

  clearProps(id: string) {
    this.activeProps.delete(id);
    this.notifyListeners();
  }

  addListener(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  getAllRegisteredSheets(): Array<{ id: string; Component: React.ComponentType<any> }> {
    const sheets: Array<{ id: string; Component: React.ComponentType<any> }> = [];
    this.sheets.forEach((component, id) => {
      sheets.push({ id, Component: component });
    });
    return sheets;
  }
}

export const SheetManager = SheetManagerClass.getInstance();