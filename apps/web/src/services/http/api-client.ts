import axios from "axios";
import { env } from "@/config/env";
import type { ApiError } from "@/types/api";
import { useAuthStore } from "@/stores/auth-store";

export const apiClient = axios.create({
  baseURL: env.VITE_API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearSession();
    }

    const normalizedError: ApiError = {
      message:
        error.response?.data?.message ??
        error.message ??
        "Something went wrong while talking to the API.",
      statusCode: error.response?.status,
    };

    return Promise.reject(normalizedError);
  },
);
