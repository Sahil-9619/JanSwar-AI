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
  token: string | null;
  isLoading: boolean;
  error: string | null;
  checkAuth: () => Promise<void>;
  requestOtp: (email: string, role?: Role, fullName?: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  logout: () => {
    localStorage.removeItem("token");
    set({ user: null, token: null, error: null });
  },

  requestOtp: async (email: string, role?: Role, fullName?: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.post("/auth/request-otp", { email, role, fullName });
      set({ isLoading: false, error: null });
    } catch (err: any) {
      console.error("Failed to request OTP:", err.message);
      set({ isLoading: false, error: err.response?.data?.error || "Failed to request OTP" });
      throw err;
    }
  },

  verifyOtp: async (email: string, otp: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post("/auth/verify-otp", { email, otp });
      const { token, user } = res.data;
      localStorage.setItem("token", token);
      set({ user, token, isLoading: false, error: null });
    } catch (err: any) {
      console.error("Failed to verify OTP:", err.message);
      set({ isLoading: false, error: err.response?.data?.error || "Failed to verify OTP" });
      throw err;
    }
  },

  checkAuth: async () => {
    const token = get().token;
    if (!token) {
      set({ user: null, isLoading: false });
      return;
    }

    set({ isLoading: true });
    try {
      const res = await api.get("/auth/me");
      set({ user: res.data.user, isLoading: false, error: null });
    } catch (err: any) {
      console.error("Profile check failed:", err.message);
      localStorage.removeItem("token");
      set({ user: null, token: null, isLoading: false, error: err.response?.data?.error || "Failed to load profile" });
    }
  },
}));
