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
  isAuthenticated: boolean;
  setAuth: (user: User) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  setAuth: (user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dentflow_user', JSON.stringify(user));
    }
    set({ user, isAuthenticated: true });
  },

  logout: async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dentflow_user');
      await supabase.auth.signOut();
    }
    set({ user: null, isAuthenticated: false });
  },

  hydrate: () => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('dentflow_user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          set({ user, isAuthenticated: true });
        } catch {
          set({ user: null, isAuthenticated: false });
        }
      }
    }
  },
}));