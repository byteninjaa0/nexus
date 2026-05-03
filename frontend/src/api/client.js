import axios from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore.js";

const baseURL = import.meta.env.VITE_API_URL ?? "";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

let refreshing = null;

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    if (status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }
      try {
        if (!refreshing) {
          refreshing = axios
            .post(`${baseURL}/api/auth/refresh`, { refreshToken })
            .then((res) => {
              const { accessToken, refreshToken: newRt, user } = res.data;
              useAuthStore.getState().setAuth({ accessToken, refreshToken: newRt, user });
              return accessToken;
            })
            .finally(() => {
              refreshing = null;
            });
        }
        const accessToken = await refreshing;
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        useAuthStore.getState().logout();
        toast.error("Session expired — please sign in again.");
      }
    }
    return Promise.reject(error);
  },
);
