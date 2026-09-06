import { Sparkles, UserCheck } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { AiApprovalsInbox } from "../components/AiApprovalsInbox";

export function ApprovalsPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              AI approvals
            </h1>
            <span className="flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <Sparkles className="size-3" />
              Needs review
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Review and authorize AI-suggested actions before they run.
          </p>
        </div>

        {/* Current User Role Pill */}
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground">
          <UserCheck className="size-3.5 text-primary" />
          <span>Signed in as</span>
          <span className="font-semibold capitalize text-foreground">
            {(user?.role ?? "guest").replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {/* Main Inbox Component */}
      <AiApprovalsInbox />
    </div>
  );
}
