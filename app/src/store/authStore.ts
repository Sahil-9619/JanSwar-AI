import { create } from "zustand";
import { api } from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  login: (email: string, pass: string) => Promise<void>;
  signup: (details: { fullName: string; email: string; pass: string; city: string; state: string; role: Role }) => Promise<void>;
  verifySignup: (email: string, otp: string) => Promise<void>;
  resendOtp: (email: string, purpose: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  verifyPasswordReset: (email: string, otp: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  logout: async () => {
    await AsyncStorage.removeItem("token");
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
      await AsyncStorage.setItem("token", token);
      set({ user, token, isLoading: false, error: null });
    } catch (err: any) {
      console.error("Failed to verify OTP:", err.message);
      set({ isLoading: false, error: err.response?.data?.error || "Failed to verify OTP" });
      throw err;
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post("/auth/login", { email, password });
      const { token, user } = res.data;
      await AsyncStorage.setItem("token", token);
      set({ user, token, isLoading: false, error: null });
    } catch (err: any) {
      console.error("Failed to log in:", err.message);
      set({ isLoading: false, error: err.response?.data?.error || "Failed to log in" });
      throw err;
    }
  },

  signup: async (details) => {
    set({ isLoading: true, error: null });
    try {
      await api.post("/auth/signup", {
        fullName: details.fullName,
        email: details.email,
        password: details.pass,
        city: details.city,
        state: details.state,
        role: details.role
      });
      set({ isLoading: false, error: null });
    } catch (err: any) {
      console.error("Failed to sign up:", err.message);
      set({ isLoading: false, error: err.response?.data?.error || "Failed to sign up" });
      throw err;
    }
  },

  verifySignup: async (email: string, otp: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post("/auth/verify-signup", { email, otp });
      const { token, user } = res.data;
      await AsyncStorage.setItem("token", token);
      set({ user, token, isLoading: false, error: null });
    } catch (err: any) {
      console.error("Failed to verify signup:", err.message);
      set({ isLoading: false, error: err.response?.data?.error || "Failed to verify signup OTP" });
      throw err;
    }
  },

  resendOtp: async (email: string, purpose: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.post("/auth/resend-otp", { email, purpose });
      set({ isLoading: false, error: null });
    } catch (err: any) {
      console.error("Failed to resend OTP:", err.message);
      set({ isLoading: false, error: err.response?.data?.error || "Failed to resend OTP" });
      throw err;
    }
  },

  requestPasswordReset: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.post("/auth/request-password-reset", { email });
      set({ isLoading: false, error: null });
    } catch (err: any) {
      console.error("Failed to request password reset:", err.message);
      let errorMessage = err.response?.data?.error || "Failed to request password reset";
      if (err.response?.status === 404 || errorMessage.toLowerCase().includes("no account found")) {
        errorMessage = "User doesn't exist";
      }
      set({ isLoading: false, error: errorMessage });
      throw err;
    }
  },

  verifyPasswordReset: async (email: string, otp: string, newPassword: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.post("/auth/verify-password-reset", { email, otp, newPassword });
      set({ isLoading: false, error: null });
    } catch (err: any) {
      console.error("Failed to verify password reset:", err.message);
      set({ isLoading: false, error: err.response?.data?.error || "Failed to verify password reset" });
      throw err;
    }
  },

  checkAuth: async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      set({ user: null, token: null, isLoading: false });
      return;
    }

    set({ isLoading: true, token });
    try {
      // In the frontend, the checkAuth uses /auth/me
      const res = await api.get("/auth/me");
      set({ user: res.data.user, isLoading: false, error: null });
    } catch (err: any) {
      console.error("Profile check failed:", err.message);
      await AsyncStorage.removeItem("token");
      set({ user: null, token: null, isLoading: false, error: err.response?.data?.error || "Failed to load profile" });
    }
  },
}));
