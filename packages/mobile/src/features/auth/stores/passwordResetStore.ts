import { create } from 'zustand';

interface PasswordResetState {
  email: string;
  resetToken: string;
  expiresIn: number;
  step: 'request' | 'verify' | 'reset';
  setEmail: (email: string) => void;
  setResetToken: (token: string, expiresIn: number) => void;
  setStep: (step: 'request' | 'verify' | 'reset') => void;
  reset: () => void;
}

export const usePasswordResetStore = create<PasswordResetState>((set) => ({
  email: '',
  resetToken: '',
  expiresIn: 0,
  step: 'request',
  setEmail: (email) => set({ email }),
  setResetToken: (token, expiresIn) => set({ resetToken: token, expiresIn }),
  setStep: (step) => set({ step }),
  reset: () => set({ 
    email: '', 
    resetToken: '', 
    expiresIn: 0, 
    step: 'request' 
  }),
}));