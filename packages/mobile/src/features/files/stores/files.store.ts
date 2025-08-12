import { create } from 'zustand';

interface FileModalState {
  isOpen: boolean;
  selectedFiles: string[];
  isMulti: boolean;
  onSelect?: (fileIds: string[]) => void;
  onClose?: () => void;
}

interface FilesStore {
  // Modal state
  modal: FileModalState;
  
  // Actions
  openModal: (options: {
    isMulti?: boolean;
    selectedFiles?: string[];
    onSelect?: (fileIds: string[]) => void;
    onClose?: () => void;
  }) => void;
  
  closeModal: () => void;
  
  toggleFileSelection: (fileId: string) => void;
  
  setSelectedFiles: (fileIds: string[]) => void;
  
  clearSelection: () => void;
}

export const useFilesStore = create<FilesStore>((set, get) => ({
  modal: {
    isOpen: false,
    selectedFiles: [],
    isMulti: false,
    onSelect: undefined,
    onClose: undefined,
  },
  
  openModal: (options) => {
    set({
      modal: {
        isOpen: true,
        isMulti: options.isMulti ?? false,
        selectedFiles: options.selectedFiles ?? [],
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
        selectedFiles: [],
        onSelect: undefined,
        onClose: undefined,
      },
    });
  },
  
  toggleFileSelection: (fileId: string) => {
    const { modal } = get();
    const { selectedFiles, isMulti } = modal;
    
    let newSelection: string[];
    
    if (isMulti) {
      // Multi-selection mode
      if (selectedFiles.includes(fileId)) {
        newSelection = selectedFiles.filter(id => id !== fileId);
      } else {
        newSelection = [...selectedFiles, fileId];
      }
    } else {
      // Single selection mode
      newSelection = selectedFiles[0] === fileId ? [] : [fileId];
    }
    
    set({
      modal: {
        ...modal,
        selectedFiles: newSelection,
      },
    });
  },
  
  setSelectedFiles: (fileIds: string[]) => {
    const { modal } = get();
    
    set({
      modal: {
        ...modal,
        selectedFiles: fileIds,
      },
    });
  },
  
  clearSelection: () => {
    const { modal } = get();
    
    set({
      modal: {
        ...modal,
        selectedFiles: [],
      },
    });
  },
}));