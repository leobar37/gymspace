import { create } from 'zustand';

export interface DisclosureState {
  open: boolean;
  onClose?: () => void;
  onOpen?: () => void;
}

export interface DisclosureActions {
  setOpen: (open: boolean) => void;
  onToggle: () => void;
  openModal: (onClose?: () => void) => void;
  closeModal: () => void;
  getProps: () => {
    open: boolean;
    onOpenChange: () => void;
  };
}

export type DisclosureStore = DisclosureState & DisclosureActions;

export interface CreateDisclosureStoreOptions {
  defaultOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
}

export function createDisclosureStore(options: CreateDisclosureStoreOptions = {}) {
  return create<DisclosureStore>((set, get) => ({
    open: options.defaultOpen || false,
    onClose: options.onClose,
    onOpen: options.onOpen,

    setOpen: (open: boolean) => {
      set({ open });
      if (open) {
        get().onOpen?.();
      } else {
        get().onClose?.();
      }
    },

    onToggle: () => {
      const { open, setOpen } = get();
      setOpen(!open);
    },

    openModal: (onClose?: () => void) => {
      set({ 
        open: true,
        onClose: onClose || get().onClose 
      });
      get().onOpen?.();
    },

    closeModal: () => {
      const { onClose } = get();
      set({ open: false });
      onClose?.();
    },

    getProps: () => {
      const { open, onToggle } = get();
      return {
        open,
        onOpenChange: onToggle,
      };
    },
  }));
}