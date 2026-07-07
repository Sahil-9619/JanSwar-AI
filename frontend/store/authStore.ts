import { create } from "zustand";
import { api } from "../services/authService";

export type Role = "CITIZEN" | "MP" | "DISTRICT_ADMIN" | "SUPER_ADMIN";

export interface User {
  id: string;
  fullName: string;
  phoneNumber: string | null;
  email: string | null;
  role: Role;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  checkAuth: () => Promise<void>;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  clearUser: () => set({ user: null, error: null }),

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get("/auth/me");
      set({ user: res.data.user, isLoading: false, error: null });
    } catch (err: any) {
      console.error("Synced database profile check failed:", err.message);
      set({ user: null, isLoading: false, error: err.response?.data?.error || "Failed to load synced profile" });
    }
  },
}));
