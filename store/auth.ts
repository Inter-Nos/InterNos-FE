import { create } from 'zustand';
import type { SessionResp, User } from '@/types/api';

interface AuthState {
  authenticated: boolean;
  user: User | null;
  csrfToken: string | null;
  setSession: (session: SessionResp) => void;
  clearSession: () => void;
  setCsrfToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  authenticated: false,
  user: null,
  csrfToken: null,
  setSession: (session) =>
    set({
      authenticated: session.authenticated,
      user: session.user,
      csrfToken: session.csrfToken,
    }),
  clearSession: () =>
    set({
      authenticated: false,
      user: null,
      csrfToken: null,
    }),
  setCsrfToken: (token) => set({ csrfToken: token }),
}));

