import { create } from 'zustand';
import type { FileResponseDto } from '@gymspace/sdk';

interface FilesStore {
  // File-related global state
  recentlyUploadedFiles: string[];
  
  // Full-screen viewer state
  viewerFile: FileResponseDto | null;
  viewerFileId: string | null;
  isViewerOpen: boolean;
  
  // Actions
  addRecentlyUploaded: (fileId: string) => void;
  clearRecentlyUploaded: () => void;
  
  // Viewer actions
  openFileViewer: (file: FileResponseDto) => void;
  openFileViewerById: (fileId: string) => void;
  closeFileViewer: () => void;
}

export const useFilesStore = create<FilesStore>((set, get) => ({
  recentlyUploadedFiles: [],
  viewerFile: null,
  viewerFileId: null,
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
      viewerFileId: null,
      isViewerOpen: true 
    });
  },
  
  openFileViewerById: (fileId: string) => {
    set({ 
      viewerFile: null,
      viewerFileId: fileId, 
      isViewerOpen: true 
    });
  },
  
  closeFileViewer: () => {
    set({ 
      viewerFile: null, 
      viewerFileId: null,
      isViewerOpen: false 
    });
  },
}));