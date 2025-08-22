import { create } from 'zustand';

interface FilesStore {
  // File-related global state
  recentlyUploadedFiles: string[];
  
  // Actions
  addRecentlyUploaded: (fileId: string) => void;
  clearRecentlyUploaded: () => void;
}

export const useFilesStore = create<FilesStore>((set, get) => ({
  recentlyUploadedFiles: [],
  
  addRecentlyUploaded: (fileId: string) => {
    set(state => ({
      recentlyUploadedFiles: [fileId, ...state.recentlyUploadedFiles.slice(0, 9)] // Keep last 10
    }));
  },
  
  clearRecentlyUploaded: () => {
    set({ recentlyUploadedFiles: [] });
  },
}));