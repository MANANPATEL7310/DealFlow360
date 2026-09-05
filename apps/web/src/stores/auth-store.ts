import type { AuthSession, AuthUser } from "@template/shared";
import { storageKeys } from "@template/shared";
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
          accessToken: session.accessToken,
          status: "authenticated",
        }),
      clearSession: () =>
        set({
          user: null,
          accessToken: null,
          status: "anonymous",
        }),
      markHydrated: () => set({ isHydrated: true }),
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
