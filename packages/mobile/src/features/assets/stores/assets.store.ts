import { create } from 'zustand';

interface AssetModalState {
  isOpen: boolean;
  selectedAssets: string[];
  isMulti: boolean;
  onSelect?: (assetIds: string[]) => void;
  onClose?: () => void;
}

interface AssetsStore {
  // Modal state
  modal: AssetModalState;
  
  // Actions
  openModal: (options: {
    isMulti?: boolean;
    selectedAssets?: string[];
    onSelect?: (assetIds: string[]) => void;
    onClose?: () => void;
  }) => void;
  
  closeModal: () => void;
  
  toggleAssetSelection: (assetId: string) => void;
  
  setSelectedAssets: (assetIds: string[]) => void;
  
  clearSelection: () => void;
}

export const useAssetsStore = create<AssetsStore>((set, get) => ({
  modal: {
    isOpen: false,
    selectedAssets: [],
    isMulti: false,
    onSelect: undefined,
    onClose: undefined,
  },
  
  openModal: (options) => {
    set({
      modal: {
        isOpen: true,
        isMulti: options.isMulti ?? false,
        selectedAssets: options.selectedAssets ?? [],
        onSelect: options.onSelect,
        onClose: options.onClose,
      },
    });
  },
  
  closeModal: () => {
    const { modal } = get();
    
    // Call onClose callback if provided
    modal.onClose?.();
    
    set({
      modal: {
        ...modal,
        isOpen: false,
        selectedAssets: [],
        onSelect: undefined,
        onClose: undefined,
      },
    });
  },
  
  toggleAssetSelection: (assetId: string) => {
    const { modal } = get();
    const { selectedAssets, isMulti } = modal;
    
    let newSelection: string[];
    
    if (isMulti) {
      // Multi-selection mode
      if (selectedAssets.includes(assetId)) {
        newSelection = selectedAssets.filter(id => id !== assetId);
      } else {
        newSelection = [...selectedAssets, assetId];
      }
    } else {
      // Single selection mode
      newSelection = selectedAssets[0] === assetId ? [] : [assetId];
    }
    
    set({
      modal: {
        ...modal,
        selectedAssets: newSelection,
      },
    });
  },
  
  setSelectedAssets: (assetIds: string[]) => {
    const { modal } = get();
    
    set({
      modal: {
        ...modal,
        selectedAssets: assetIds,
      },
    });
  },
  
  clearSelection: () => {
    const { modal } = get();
    
    set({
      modal: {
        ...modal,
        selectedAssets: [],
      },
    });
  },
}));