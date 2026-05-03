import { create } from "zustand";

export const useUiStore = create((set) => ({
  sidebarCollapsed: false,
  theme: "dark",
  searchOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSearchOpen: (v) => set({ searchOpen: v }),
}));
