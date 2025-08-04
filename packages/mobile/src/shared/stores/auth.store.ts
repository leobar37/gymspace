import { atom } from 'jotai';

export interface User {
  id: string;
  email: string;
  name: string;
  userType: string;
}

export interface Gym {
  id: string;
  name: string;
  organizationId: string;
}

export const userAtom = atom<User | null>(null);
export const gymAtom = atom<Gym | null>(null);
export const isAuthenticatedAtom = atom((get) => get(userAtom) !== null);
export const accessTokenAtom = atom<string | null>(null);
export const refreshTokenAtom = atom<string | null>(null);