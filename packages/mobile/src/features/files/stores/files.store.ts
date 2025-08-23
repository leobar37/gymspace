import { create } from 'zustand';
import type { FileResponseDto } from '@gymspace/sdk';

interface FilesStore {
  // File-related global state
  recentlyUploadedFiles: string[];
  
  // Full-screen viewer state
  viewerFile: FileResponseDto | null;
  isViewerOpen: boolean;
  
  // Actions
  addRecentlyUploaded: (fileId: string) => void;
  clearRecentlyUploaded: () => void;
  
  // Viewer actions
  openFileViewer: (file: FileResponseDto) => void;
  closeFileViewer: () => void;
}

export const useFilesStore = create<FilesStore>((set, get) => ({
  recentlyUploadedFiles: [],
  viewerFile: null,
  isViewerOpen: false,
  
  addRecentlyUploaded: (fileId: string) => {
    set(state => ({
      recentlyUploadedFiles: [fileId, ...state.recentlyUploadedFiles.slice(0, 9)] // Keep last 10
    }));
  },
  
  clearRecentlyUploaded: () => {
    set({ recentlyUploadedFiles: [] });
  },
  
  openFileViewer: (file: FileResponseDto) => {
    set({ 
      viewerFile: file, 
      isViewerOpen: true 
    });
  },
  
  closeFileViewer: () => {
    set({ 
      viewerFile: null, 
      isViewerOpen: false 
    });
  },
}));