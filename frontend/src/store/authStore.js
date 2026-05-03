import { create } from "zustand";
import { persist } from "zustand/middleware";

const storageKey = "nexus-auth";

export const useAuthStore = create(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setAuth: ({ accessToken, refreshToken, user }) =>
        set({ accessToken, refreshToken, user }),
      setUser: (user) => set({ user }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      logout: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    {
      name: storageKey,
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        user: s.user,
      }),
    },
  ),
);
