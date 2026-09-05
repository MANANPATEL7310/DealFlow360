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
              AI Approvals Inbox
            </h1>
            <span className="flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <Sparkles className="size-3" />
              HITL Gate
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Review, amend, and authorize AI-generated actions before execution
            via Document A services.
          </p>
        </div>

        {/* Current User Role Pill */}
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground">
          <UserCheck className="size-3.5 text-primary" />
          <span>Active Role:</span>
          <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono font-semibold text-foreground">
            {user?.role ?? "unauthenticated"}
          </code>
        </div>
      </div>

      {/* Main Inbox Component */}
      <AiApprovalsInbox />
    </div>
  );
}
