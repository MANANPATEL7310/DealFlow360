import type { AuthSession, AuthUser, UserRole } from "@template/shared";
import { DEMO_PERSONAS, storageKeys } from "@template/shared";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type AuthStore = {
  user: AuthUser | null;
  accessToken: string | null;
  status: "anonymous" | "authenticated";
  isHydrated: boolean;
  setSession: (session: AuthSession) => void;
  clearSession: () => void;
  markHydrated: () => void;
  switchPersona: (role: UserRole) => void;
};

const dummyStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      status: "anonymous",
      isHydrated: false,
      setSession: (session) =>
        set({
          user: session.user,
          accessToken: session.accessToken ?? session.token ?? null,
          status: "authenticated",
        }),
      clearSession: () =>
        set({
          user: null,
          accessToken: null,
          status: "anonymous",
        }),
      markHydrated: () => set({ isHydrated: true }),
      switchPersona: (role) => {
        const persona = DEMO_PERSONAS[role];
        if (!persona) return;
        set({
          user: {
            id: `usr-${role}-demo`,
            name: persona.name,
            email: persona.email,
            role: persona.role,
          },
          accessToken: `mock-token-${role}-${Date.now()}`,
          status: "authenticated",
        });
      },
    }),
    {
      name: storageKeys.authSession,
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : dummyStorage,
      ),
      partialize: ({ user, accessToken, status }) => ({
        user,
        accessToken,
        status,
      }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    },
  ),
);
