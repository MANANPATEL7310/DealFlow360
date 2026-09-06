import { Link } from "react-router";
import { Plus, GitPullRequest, Activity } from "lucide-react";
import { appRoutes } from "@template/shared";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";

export function DashboardHeader() {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name?.split(" ")[0] ?? "there";

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {greeting}, {firstName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here's what's happening across your pipeline today.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <Link to={appRoutes.dealHealth}>
          <Button variant="outline" size="sm" className="gap-2 text-xs">
            <Activity className="size-3.5" />
            Deal health
          </Button>
        </Link>
        <Link to={appRoutes.approvals}>
          <Button variant="outline" size="sm" className="gap-2 text-xs">
            <GitPullRequest className="size-3.5" />
            Approvals
          </Button>
        </Link>
        <Link to={appRoutes.quotations}>
          <Button size="sm" className="gap-2 text-xs font-semibold">
            <Plus className="size-4" />
            New quotation
          </Button>
        </Link>
      </div>
    </div>
  );
}
