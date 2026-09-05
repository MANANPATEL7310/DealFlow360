import { Link } from "react-router";
import { Plus, GitPullRequest, Activity, ShieldCheck } from "lucide-react";
import { appRoutes } from "@template/shared";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";

export function DashboardHeader() {
  const user = useAuthStore((s) => s.user);
  const userName = user?.name ?? "Sales Operations";
  const userRole = user?.role ?? "sales_rep";

  const roleLabelMap: Record<string, string> = {
    sales_rep: "Sales Representative",
    sales_manager: "Sales Manager / Approver",
    finance: "Finance & Operations",
    admin: "Platform Administrator",
  };

  return (
    <div className="flex flex-col gap-4 border-b border-border/80 pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Command Center
          </h1>
          <span className="inline-flex items-center gap-1 rounded-full border border-secondary/30 bg-secondary/10 px-2.5 py-0.5 text-xs font-semibold text-secondary">
            <ShieldCheck className="size-3.5" />
            Live Engine
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back,{" "}
          <span className="font-semibold text-foreground">{userName}</span> ·{" "}
          <span className="capitalize">
            {roleLabelMap[userRole] ?? userRole}
          </span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <Link to={appRoutes.dealHealth}>
          <Button variant="outline" size="sm" className="gap-2 text-xs">
            <Activity className="size-3.5 text-warning" />
            Scan Radar
          </Button>
        </Link>
        <Link to={appRoutes.approvals}>
          <Button variant="outline" size="sm" className="gap-2 text-xs">
            <GitPullRequest className="size-3.5 text-primary" />
            Approvals
          </Button>
        </Link>
        <Link to={appRoutes.quotations}>
          <Button
            size="sm"
            className="gap-2 text-xs font-semibold shadow-md shadow-primary/20"
          >
            <Plus className="size-4" />
            New Quotation
          </Button>
        </Link>
      </div>
    </div>
  );
}
