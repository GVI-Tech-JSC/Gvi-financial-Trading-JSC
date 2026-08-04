"use client";
import { create } from "zustand";

interface AuthState {
  user:      any | null;
  token:     string | null;
  isLoggedIn: boolean;
  setAuth:   (user: any, token: string) => void;
  logout:    () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user:       null,
  token:      null,
  isLoggedIn: false,
  setAuth:   (user, token) => {
    if (typeof window !== "undefined") localStorage.setItem("accessToken", token);
    set({ user, token, isLoggedIn: true });
  },
  logout: () => {
    if (typeof window !== "undefined") localStorage.removeItem("accessToken");
    set({ user: null, token: null, isLoggedIn: false });
  },
}));
