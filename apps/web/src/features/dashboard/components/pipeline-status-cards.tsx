import {
  FileEdit,
  GitPullRequest,
  CheckCircle,
  Send,
  MessageSquareCheck,
  CheckCheck,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardSummary } from "../hooks/use-dashboard-data";

export function PipelineStatusCards() {
  const { data, isLoading } = useDashboardSummary();
  const stages = data?.stages;

  const stageConfig = [
    {
      key: "draft",
      label: "Drafting",
      count: stages?.draft ?? 0,
      icon: FileEdit,
      toneColor: "text-muted-foreground",
      badgeColor: "bg-surface-muted text-muted-foreground",
    },
    {
      key: "pendingApproval",
      label: "Approval Gate",
      count: stages?.pendingApproval ?? 0,
      icon: GitPullRequest,
      toneColor: "text-warning",
      badgeColor: "bg-warning/10 text-warning border-warning/20",
    },
    {
      key: "approved",
      label: "Approved",
      count: stages?.approved ?? 0,
      icon: CheckCircle,
      toneColor: "text-primary",
      badgeColor: "bg-primary/10 text-primary border-primary/20",
    },
    {
      key: "sent",
      label: "Sent to Client",
      count: stages?.sent ?? 0,
      icon: Send,
      toneColor: "text-primary-light",
      badgeColor: "bg-primary-light/10 text-primary-light border-primary-light/20",
    },
    {
      key: "underNegotiation",
      label: "Portal Negotiation",
      count: stages?.underNegotiation ?? 0,
      icon: MessageSquareCheck,
      toneColor: "text-secondary",
      badgeColor: "bg-secondary/10 text-secondary border-secondary/20",
    },
    {
      key: "confirmed",
      label: "Confirmed & Billed",
      count: stages?.confirmed ?? 0,
      icon: CheckCheck,
      toneColor: "text-secondary",
      badgeColor: "bg-secondary/15 text-secondary border-secondary/30",
    },
  ];

  return (
    <div className="surface-card p-5">
      <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
        <div>
          <h2 className="text-sm font-bold text-foreground sm:text-base">
            Quotation Pipeline Lifecycle
          </h2>
          <p className="text-xs text-muted-foreground">
            Current distribution across the 6-stage quotation-to-cash workflow
          </p>
        </div>
        <span className="hidden font-mono text-xs text-muted-foreground sm:inline-block">
          Auto-Governance Enforced
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stageConfig.map((st) => {
          const Icon = st.icon;
          return (
            <div
              key={st.key}
              className="flex flex-col justify-between rounded-xl border border-border bg-surface-muted/30 p-3.5 transition-all hover:bg-surface-muted/60"
            >
              <div className="flex items-center justify-between">
                <Icon className={`size-4 ${st.toneColor}`} />
                {isLoading ? (
                  <Skeleton className="h-5 w-8 rounded-full" />
                ) : (
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-bold ${st.badgeColor}`}
                  >
                    {st.count}
                  </span>
                )}
              </div>
              <div className="mt-3">
                <p className="truncate text-xs font-semibold text-foreground">
                  {st.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {st.count === 1 ? "1 active quote" : `${st.count} quotes`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PipelineStatusCards;
