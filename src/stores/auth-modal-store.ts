import { create } from 'zustand';

type AuthView = 'login' | 'register';

interface AuthModalState {
  // State
  isOpen: boolean;
  view: AuthView;
  callbackUrl?: string;

  // Methods
  openLogin: (callbackUrl?: string) => void;
  openRegister: (callbackUrl?: string) => void;
  setView: (view: AuthView) => void;
  close: () => void;
}

export const useAuthModalStore = create<AuthModalState>((set) => ({
  isOpen: false,
  view: 'login',
  callbackUrl: undefined,

  openLogin: (callbackUrl) =>
    set({
      isOpen: true,
      view: 'login',
      callbackUrl,
    }),

  openRegister: (callbackUrl) =>
    set({
      isOpen: true,
      view: 'register',
      callbackUrl,
    }),

  setView: (view) => set({ view }),

  close: () =>
    set({
      isOpen: false,
      callbackUrl: undefined,
    }),
}));
