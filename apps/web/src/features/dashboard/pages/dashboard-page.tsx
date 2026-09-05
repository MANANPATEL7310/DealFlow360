import { useState } from "react";
import { Link } from "react-router";
import {
  ShieldCheck,
  Bot,
  MessageSquare,
  Sliders,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { useApprovals } from "@/features/approvals/api/use-approvals";
import { AiApprovalsInbox } from "@/features/approvals/components/AiApprovalsInbox";
import { AiReviewPanel } from "@/features/quotations/components/AiReviewPanel";
import { AiNegotiationAssistant } from "@/features/portal-internal/components/AiNegotiationAssistant";

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: pendingApprovals } = useApprovals("PENDING");
  const [activeTab, setActiveTab] = useState<
    "approvals" | "discount" | "negotiation"
  >("approvals");
  const [sampleQuoteId, setSampleQuoteId] = useState("quote-sample-01");
  const [sampleRequestId, setSampleRequestId] = useState("req-sample-01");

  const pendingCount = pendingApprovals?.length ?? 0;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-surface to-surface-muted/30 p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                DealFlow360 Executive Console
              </h1>
              <Badge tone="primary" className="border-primary/40 text-primary">
                Dev 1 Governance Spine
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Self-governing sales intelligence with deterministic risk engines
              & human-in-the-loop AI.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/app/approvals">
              <Button size="sm" className="text-xs">
                <ShieldCheck className="mr-1.5 size-3.5" />
                View Approvals Queue ({pendingCount})
              </Button>
            </Link>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border/70 bg-surface/70 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Pending AI Approvals
              </span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-warning/10 text-warning-dark dark:text-warning-light">
                <ShieldCheck className="size-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">
                {pendingCount}
              </span>
              <span className="text-xs text-muted-foreground">
                actionable tasks
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-border/70 bg-surface/70 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Active AI Agents
              </span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Bot className="size-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">2</span>
              <span className="text-xs text-muted-foreground">
                Agent 1 & Agent 6
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-border/70 bg-surface/70 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Governance Integrity
              </span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-success/10 text-success">
                <CheckCircle2 className="size-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-sm font-bold text-success">
                100% Guaranteed
              </span>
              <span className="text-xs text-muted-foreground">
                Zero direct DB writes
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Tabs */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("approvals")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
              activeTab === "approvals"
                ? "bg-primary text-surface shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShieldCheck className="size-3.5" />
            HITL Approvals Queue
            {pendingCount > 0 && (
              <span className="rounded-full bg-surface/20 px-1.5 py-0.5 font-mono text-xs">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("discount")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
              activeTab === "discount"
                ? "bg-primary text-surface shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sliders className="size-3.5" />
            Agent 1: Discount Advisory
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("negotiation")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
              activeTab === "negotiation"
                ? "bg-primary text-surface shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageSquare className="size-3.5" />
            Agent 6: Negotiation Assistant
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "approvals" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">
                Human-in-the-Loop Action Approval Queue
              </h2>
              <span className="text-xs text-muted-foreground">
                Logged in as role:{" "}
                <strong className="text-foreground">
                  {user?.role ?? "guest"}
                </strong>
              </span>
            </div>
            <AiApprovalsInbox />
          </div>
        )}

        {activeTab === "discount" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-muted/30 p-3 text-xs">
              <span className="text-muted-foreground">
                Quotation Identifier to Evaluate:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={sampleQuoteId}
                  onChange={(e) => setSampleQuoteId(e.target.value)}
                  className="rounded border border-border bg-surface px-2.5 py-1 font-mono text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  placeholder="Enter quotationId..."
                />
              </div>
            </div>
            <AiReviewPanel quotationId={sampleQuoteId} />
          </div>
        )}

        {activeTab === "negotiation" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-muted/30 p-3 text-xs">
              <span className="text-muted-foreground">
                Negotiation Request Identifier to Assist:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={sampleRequestId}
                  onChange={(e) => setSampleRequestId(e.target.value)}
                  className="rounded border border-border bg-surface px-2.5 py-1 font-mono text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  placeholder="Enter requestId..."
                />
              </div>
            </div>
            <AiNegotiationAssistant requestId={sampleRequestId} />
          </div>
        )}
      </div>
    </div>
  );
}
