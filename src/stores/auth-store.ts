import { create } from "zustand";
import type { User } from "@/types/user";

interface AuthState {
  accessToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (access: string, refresh: string, user: User) => void;
  logout: () => void;
  setAccessToken: (token: string) => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,

  login: (access, refresh, user) => {
    localStorage.setItem("refresh_token", refresh);
    set({ accessToken: access, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem("refresh_token");
    sessionStorage.removeItem("doggo:booking-flow");
    set({ accessToken: null, user: null, isAuthenticated: false });
  },

  setAccessToken: (token) => {
    set({ accessToken: token });
  },

  setUser: (user) => {
    set({ user });
  },
}));
