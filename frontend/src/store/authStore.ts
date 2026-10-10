import { create } from 'zustand';
import { User } from '../types';
import { authApi } from '../services/authApi';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  login: (data: { email: string; password: string }) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),

  login: async (credentials) => {
    const res = await authApi.login(credentials);
    if (res.access_token) {
      localStorage.setItem('shipsense_token', res.access_token);
    }
    set({ user: res.user, isAuthenticated: true, isLoading: false });
  },

  register: async (registerData) => {
    const res = await authApi.register(registerData);
    if (res.access_token) {
      localStorage.setItem('shipsense_token', res.access_token);
    }
    set({ user: res.user, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem('shipsense_token');
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  checkAuth: async () => {
    try {
      const user = await authApi.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('shipsense_token');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
