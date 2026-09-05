import {
  apiRoutes,
  type AuthSession,
  type LoginInput,
  type RegisterInput,
} from "@template/shared";
import { apiClient } from "@/services/http/api-client";

export async function login(payload: LoginInput): Promise<AuthSession> {
  const { data } = await apiClient.post(apiRoutes.auth.login.path, payload);
  return data.data;
}

export async function register(payload: RegisterInput): Promise<AuthSession> {
  const { data } = await apiClient.post(apiRoutes.auth.register.path, payload);
  return data.data;
}
