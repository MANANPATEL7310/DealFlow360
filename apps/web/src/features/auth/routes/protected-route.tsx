import type { ReactNode } from "react";
import { useSyncExternalStore } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { appRoutes } from "@template/shared";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useAuthStore } from "@/stores/auth-store";

const noopSubscribe = () => () => {};

export function ProtectedRoute({ children }: { children?: ReactNode }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const location = useLocation();

  const isClient = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  // During SSR before client hydration, render session restore card
  if (!isClient && !isHydrated) {
    return (
      <main className="app-shell flex items-center justify-center">
        <Card className="flex items-center gap-3 text-sm text-muted-foreground">
          <Spinner size="sm" />
          Restoring your saved workspace session...
        </Card>
      </main>
    );
  }

  // If unauthenticated on client, route to login immediately
  if (!accessToken) {
    return <Navigate replace state={{ from: location }} to={appRoutes.login} />;
  }

  return children ? <>{children}</> : <Outlet />;
}
