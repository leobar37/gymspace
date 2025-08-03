import { atom } from "jotai";

// Example atoms for global state management
export const userAtom = atom<{ name: string; email: string } | null>(null);
export const counterAtom = atom(0);
export const themeAtom = atom<"light" | "dark">("light");