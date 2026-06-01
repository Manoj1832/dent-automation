import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dentflow_token', token);
      localStorage.setItem('dentflow_user', JSON.stringify(user));
    }
    set({ user, token, isAuthenticated: true });
  },

  logout: async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dentflow_token');
      localStorage.removeItem('dentflow_user');
      await supabase.auth.signOut();
    }
    set({ user: null, token: null, isAuthenticated: false });
  },

  hydrate: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('dentflow_token');
      const userStr = localStorage.getItem('dentflow_user');
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          set({ user, token, isAuthenticated: true });
        } catch {
          set({ user: null, token: null, isAuthenticated: false });
        }
      }
    }
  },
}));