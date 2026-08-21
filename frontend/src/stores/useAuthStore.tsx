import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "user" | "admin" | "driver";
  avatar?: string;
  isEmailVerified: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;

  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,

      setAuth: (user: User, token: string) => {
        set({ user, token });
      },

      clearAuth: () => {
        set({ user: null, token: null });
      },

      setUser: (user: User) => set({ user }),
    }),
    {
      name: "cotram-auth",
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    },
  ),
);
