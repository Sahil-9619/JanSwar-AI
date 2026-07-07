import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach dynamic Clerk JWT to requests
api.interceptors.request.use(
  async (config) => {
    if (typeof window !== "undefined") {
      try {
        // Clerk puts the main client instance on window when loaded
        const clerk = (window as any).Clerk;
        if (clerk && clerk.session) {
          const token = await clerk.session.getToken();
          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
      } catch (error) {
        console.error("Error retrieving Clerk session token:", error);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);
