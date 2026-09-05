import axios from "axios";
import { env } from "@/config/env";
import { getPortalToken, clearPortalToken } from "../lib/portal-token";

/**
 * Dedicated isolated HTTP client for the Customer Portal.
 * It NEVER reads from or sends the internal sales representative auth store.
 */
export const portalHttp = axios.create({
  baseURL: env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

portalHttp.interceptors.request.use((config) => {
  const token = getPortalToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

portalHttp.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      clearPortalToken();
    }
    return Promise.reject(error);
  },
);
