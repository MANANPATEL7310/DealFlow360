import type { ReactNode } from "react";
import { Link } from "react-router";
import { appRoutes, DEMO_PERSONAS, type UserRole } from "@template/shared";
import { ArrowLeft, ShieldAlert, UserCheck } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children?: ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const user = useAuthStore((state) => state.user);
  const switchPersona = useAuthStore((state) => state.switchPersona);

  if (!user) {
    const recommendedRole = allowedRoles[0] ?? "admin";
    const recommendedPersona = DEMO_PERSONAS[recommendedRole];

    const handleSwitch = () => {
      switchPersona(recommendedRole);
      toast.success(
        `Signed in as ${recommendedPersona.name} (${recommendedPersona.title})`,
      );
    };

    return (
      <div className="flex min-h-120 items-center justify-center p-6">
        <Card className="bg-card w-full max-w-lg space-y-6 border-amber-500/30 p-8 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <ShieldAlert className="size-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Authentication Required
              </h2>
              <p className="text-xs text-muted-foreground">
                This workbench requires elevated privileges. Select an
                authorized demo persona to continue.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              className="w-full gap-2"
              type="button"
              onClick={handleSwitch}
            >
              <UserCheck className="size-4" />
              <span>
                Sign in as {recommendedPersona.name} ({recommendedPersona.title}
                )
              </span>
            </Button>
            <Link
              className="bg-card hover:bg-muted flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors"
              to={appRoutes.dashboard}
            >
              <ArrowLeft className="size-4" />
              <span>Return to Dashboard</span>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const hasAccess = allowedRoles.includes(user.role);

  if (!hasAccess) {
    const recommendedRole = allowedRoles[0] ?? "sales_rep";
    const recommendedPersona = DEMO_PERSONAS[recommendedRole];

    const handleSwitch = () => {
      switchPersona(recommendedRole);
      toast.success(
        `Switched to ${recommendedPersona.name} (${recommendedPersona.title})`,
      );
    };

    return (
      <div className="flex min-h-120 items-center justify-center p-6">
        <Card className="bg-card w-full max-w-lg space-y-6 border-amber-500/30 p-8 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <ShieldAlert className="size-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Access Restricted by Role Governance
              </h2>
              <p className="text-xs text-muted-foreground">
                This workbench requires elevated operational privileges.
              </p>
            </div>
          </div>

          <div className="bg-muted/40 space-y-3 rounded-lg border border-border p-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                Current Active Role:
              </span>
              <span className="bg-card rounded-full border border-border px-2.5 py-0.5 font-semibold text-foreground capitalize">
                {user.role.replace("_", " ")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                Required Privileges:
              </span>
              <div className="flex flex-wrap gap-1">
                {allowedRoles.map((role) => (
                  <span
                    key={role}
                    className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 font-semibold text-primary capitalize"
                  >
                    {role.replace("_", " ")}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              className="w-full gap-2"
              type="button"
              onClick={handleSwitch}
            >
              <UserCheck className="size-4" />
              <span>
                Switch to {recommendedPersona.name} ({recommendedPersona.title})
              </span>
            </Button>
            <Link
              className="bg-card hover:bg-muted flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors"
              to={appRoutes.dashboard}
            >
              <ArrowLeft className="size-4" />
              <span>Return to Dashboard</span>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return children ? <>{children}</> : null;
}
