import { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { appRoutes } from "@template/shared";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useAuthStore } from "@/stores/auth-store";

export function ProtectedRoute({ children }: { children?: ReactNode }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const location = useLocation();

  if (!isHydrated) {
    return (
      <main className="app-shell flex items-center justify-center">
        <Card className="flex items-center gap-3 text-sm text-muted-foreground">
          <Spinner size="sm" />
          Restoring your saved workspace session...
        </Card>
      </main>
    );
  }

  if (!accessToken) {
    return <Navigate replace state={{ from: location }} to={appRoutes.login} />;
  }

  return children ? <>{children}</> : <Outlet />;
}
