import { create } from 'zustand';
import type { User } from '@/types/user';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  login: (user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated:
    typeof window !== 'undefined'
      ? !!sessionStorage.getItem('aktivar_access_token')
      : false,
  isLoading: false,

  setUser: (user) =>
    set({ user, isAuthenticated: !!user }),

  login: (user) =>
    set({ user, isAuthenticated: true, isLoading: false }),

  logout: () => {
    sessionStorage.removeItem('aktivar_access_token');
    sessionStorage.removeItem('aktivar_refresh_token');
    set({ user: null, isAuthenticated: false });
  },

  setLoading: (isLoading) => set({ isLoading }),
}));
