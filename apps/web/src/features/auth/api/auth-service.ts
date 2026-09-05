import {
  apiRoutes,
  authSessionSchema,
  type AuthSession,
  type LoginInput,
} from "@template/shared";
import { apiClient } from "@/services/http/api-client";

export async function login(payload: LoginInput): Promise<AuthSession> {
  const { data } = await apiClient.post(apiRoutes.auth.login.path, payload);
  return authSessionSchema.parse(data.data);
}
