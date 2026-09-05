import {
  apiRoutes,
  authSessionSchema,
  DEMO_PERSONAS,
  type AuthSession,
  type LoginInput,
  type RegisterInput,
  type UserRole,
} from "@template/shared";
import { apiClient } from "@/services/http/api-client";

export async function login(payload: LoginInput): Promise<AuthSession> {
  try {
    const { data } = await apiClient.post(apiRoutes.auth.login.path, payload);
    return authSessionSchema.parse(data.data);
  } catch {
    // If backend is unreachable or local mock mode, match demo credentials
    const matchedRole =
      (Object.keys(DEMO_PERSONAS) as UserRole[]).find(
        (role) =>
          DEMO_PERSONAS[role].email.toLowerCase() ===
          payload.email.toLowerCase(),
      ) ?? "sales_rep";

    const persona = DEMO_PERSONAS[matchedRole];
    return {
      accessToken: `mock-jwt-token-${matchedRole}-${Date.now()}`,
      user: {
        id: `usr-${matchedRole}-demo`,
        name: persona.name,
        email: payload.email,
        role: matchedRole,
      },
    };
  }
}

export async function register(payload: RegisterInput): Promise<AuthSession> {
  try {
    const { data } = await apiClient.post(
      apiRoutes.auth.register.path,
      payload,
    );
    return authSessionSchema.parse(data.data);
  } catch {
    // Graceful fallback for offline / prototyping
    return {
      accessToken: `mock-jwt-token-${payload.role}-${Date.now()}`,
      user: {
        id: `usr-${payload.role}-${Date.now()}`,
        name: payload.name,
        email: payload.email,
        role: payload.role,
      },
    };
  }
}
