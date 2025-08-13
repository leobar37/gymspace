import { create } from 'zustand';
import type { LoadingScreenStore, LoadingScreenAction, LoadingScreenState } from './types';

export const useLoadingScreenStore = create<LoadingScreenStore>((set) => ({
  state: 'idle',
  message: '',
  actions: [],

  show: (state: LoadingScreenState, message: string, actions: LoadingScreenAction[] = []) => {
    set({
      state,
      message,
      actions,
    });
  },

  hide: () => {
    set({
      state: 'idle',
      message: '',
      actions: [],
    });
  },

  reset: () => {
    set({
      state: 'idle',
      message: '',
      actions: [],
    });
  },
}));