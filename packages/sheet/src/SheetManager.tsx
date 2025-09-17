import type { RefObject } from 'react';
import type { BottomSheetModal, BottomSheetModalProps } from '@gorhom/bottom-sheet';
import type { SheetManagerType } from './types';

class SheetManagerClass implements SheetManagerType {
  private static instance: SheetManagerClass;
  private sheets = new Map<string, React.ComponentType<any>>();
  private options = new Map<string, Partial<BottomSheetModalProps>>();
  private refs = new Map<string, RefObject<BottomSheetModal>>();
  private activeProps = new Map<string, any>();

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
      ref.current.present();
    } else {
      console.warn(`Sheet with id "${id}" not found or not mounted`);
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
  }
}

export const SheetManager = SheetManagerClass.getInstance();