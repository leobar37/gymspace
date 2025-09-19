import { atom, WritableAtom } from 'jotai';

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

export const userAtom = atom<User>(undefined!) as WritableAtom<User>;
export const gymAtom = atom<Gym>(undefined!) as WritableAtom<Gym>;
export const isAuthenticatedAtom = atom((get) => get(userAtom) !== null);
export const accessTokenAtom = atom<string | null>(null);