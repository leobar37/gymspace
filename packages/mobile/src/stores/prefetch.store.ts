import { create } from 'zustand';

interface PrefetchStore {
  hasPrefetchedClients: boolean;
  hasPrefetchedProducts: boolean;
  hasPrefetchedCategories: boolean;
  hasPrefetchedServices: boolean;
  lastPrefetchTime: number | null;
  
  markClientsPrefetched: () => void;
  markProductsPrefetched: () => void;
  markCategoriesPrefetched: () => void;
  markServicesPrefetched: () => void;
  
  shouldPrefetch: (resource: 'clients' | 'products' | 'categories' | 'services') => boolean;
  resetPrefetch: () => void;
}

export const usePrefetchStore = create<PrefetchStore>((set, get) => ({
  hasPrefetchedClients: false,
  hasPrefetchedProducts: false,
  hasPrefetchedCategories: false,
  hasPrefetchedServices: false,
  lastPrefetchTime: null,
  
  markClientsPrefetched: () => set({ 
    hasPrefetchedClients: true,
    lastPrefetchTime: Date.now()
  }),
  
  markProductsPrefetched: () => set({ 
    hasPrefetchedProducts: true,
    lastPrefetchTime: Date.now()
  }),
  
  markCategoriesPrefetched: () => set({ 
    hasPrefetchedCategories: true,
    lastPrefetchTime: Date.now()
  }),
  
  markServicesPrefetched: () => set({ 
    hasPrefetchedServices: true,
    lastPrefetchTime: Date.now()
  }),
  
  shouldPrefetch: (resource) => {
    const state = get();
    const now = Date.now();
    const cacheTime = 5 * 60 * 1000; // 5 minutes cache
    
    // If never prefetched, do it
    switch(resource) {
      case 'clients':
        return !state.hasPrefetchedClients || 
               (state.lastPrefetchTime && now - state.lastPrefetchTime > cacheTime);
      case 'products':
        return !state.hasPrefetchedProducts ||
               (state.lastPrefetchTime && now - state.lastPrefetchTime > cacheTime);
      case 'categories':
        return !state.hasPrefetchedCategories ||
               (state.lastPrefetchTime && now - state.lastPrefetchTime > cacheTime);
      case 'services':
        return !state.hasPrefetchedServices ||
               (state.lastPrefetchTime && now - state.lastPrefetchTime > cacheTime);
      default:
        return true;
    }
  },
  
  resetPrefetch: () => set({
    hasPrefetchedClients: false,
    hasPrefetchedProducts: false,
    hasPrefetchedCategories: false,
    hasPrefetchedServices: false,
    lastPrefetchTime: null,
  }),
}));