import { create } from 'zustand';

interface FilesStore {
  // Currently this store doesn't need any state since we removed modal functionality
  // Keeping it for potential future file-related state management
  
  // You can add file-related global state here if needed, for example:
  // - Recently uploaded files
  // - File upload progress
  // - File categories/tags
  // - etc.
}

export const useFilesStore = create<FilesStore>((set, get) => ({
  // Currently empty - can be extended as needed
}));