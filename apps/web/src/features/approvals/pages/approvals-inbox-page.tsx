import { Inbox, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RoleGuard } from "@/features/auth/routes/role-guard";
import { ApprovalsInboxTable } from "@/features/approvals/components/approvals-inbox-table";
import { ApprovalsStats } from "@/features/approvals/components/approvals-stats";
import { usePendingApprovals } from "@/features/approvals/hooks/use-approvals";

export function ApprovalsInboxPage() {
  const { data: items = [], isLoading } = usePendingApprovals();

  return (
    <RoleGuard allowedRoles={["sales_manager", "finance", "admin"]}>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Inbox className="size-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Deal Approvals & Governance
              </h1>
              <Badge tone="primary">Reviewer Workbench</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Review escalated quotations requiring managerial sign-off or finance
              margin concession authorization.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
              <ShieldAlert className="size-3.5 text-warning" /> Multi-Tier Sequential Chain
            </span>
          </div>
        </div>

        {/* Stats Ribbon */}
        <ApprovalsStats isLoading={isLoading} items={items} />

        {/* Approval Queue Table Card */}
        <div className="surface-card space-y-4 rounded-xl border border-border p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-base font-bold text-foreground">
                Pending Approval Queue
              </h2>
              <p className="text-xs text-muted-foreground">
                Ordered by urgency and customer escalation thresholds
              </p>
            </div>
            <Badge tone="neutral" className="text-xs font-semibold">
              {items.length} Active Deals
            </Badge>
          </div>

          <ApprovalsInboxTable isLoading={isLoading} items={items} />
        </div>
      </div>
    </RoleGuard>
  );
}
