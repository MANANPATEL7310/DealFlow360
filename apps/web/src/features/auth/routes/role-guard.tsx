import type { ReactNode } from "react";
import { Link } from "react-router";
import { appRoutes, type UserRole } from "@template/shared";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children?: ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const user = useAuthStore((state) => state.user);
  const allowed = user && allowedRoles.includes(user.role);
  if (allowed) return children ? <>{children}</> : null;
  return (
    <div className="flex min-h-120 items-center justify-center p-6">
      <Card className="bg-card w-full max-w-lg space-y-5 border-amber-500/30 p-8 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <ShieldAlert className="size-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {user ? "Access Restricted" : "Authentication Required"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {user
                ? "Your assigned role is not authorized for this workspace."
                : "Sign in with an authorized account to continue."}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={user ? appRoutes.dashboard : appRoutes.login}>
            <Button className="gap-2">
              <ArrowLeft className="size-4" />
              {user ? "Return to Dashboard" : "Sign In"}
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
