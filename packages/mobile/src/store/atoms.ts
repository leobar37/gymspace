import { atom } from 'jotai';

// User and auth atoms
export const userAtom = atom<any>(null);
export const isAuthenticatedAtom = atom((get) => get(userAtom) !== null);

// Current gym atom
export const currentGymAtom = atom<any>(null);

// Navigation state
export const currentTabAtom = atom<'dashboard' | 'clients' | 'contracts' | 'more'>('dashboard');

// Theme atom
export const themeAtom = atom<'light' | 'dark'>('light');