import { useState } from "react";
import { Link } from "react-router";
import { ShieldCheck, MessageSquare, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApprovals } from "@/features/approvals/api/use-approvals";
import { AiApprovalsInbox } from "@/features/approvals/components/AiApprovalsInbox";
import { AiReviewPanel } from "@/features/quotations/components/AiReviewPanel";
import { AiNegotiationAssistant } from "@/features/portal-internal/components/AiNegotiationAssistant";

import { DashboardHeader } from "../components/dashboard-header";
import { KpiStatsGrid } from "../components/kpi-stats-grid";
import { PipelineStatusCards } from "../components/pipeline-status-cards";
import { RecentQuotesTable } from "../components/recent-quotes-table";
import { DealHealthWidget } from "../components/deal-health-widget";

export function DashboardPage() {
  const { data: pendingApprovals } = useApprovals("PENDING");
  const [activeTab, setActiveTab] = useState<
    "approvals" | "discount" | "negotiation"
  >("approvals");
  const [sampleQuoteId, setSampleQuoteId] = useState("quote-sample-01");
  const [sampleRequestId, setSampleRequestId] = useState("req-sample-01");

  const pendingCount = pendingApprovals?.length ?? 0;

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Header with Greetings, Role, and Action Buttons */}
      <DashboardHeader />

      {/* 2. Executive 4-Card KPI Grid */}
      <KpiStatsGrid />

      {/* 3. 6-Stage Quote-to-Cash Pipeline Tracker */}
      <PipelineStatusCards />

      {/* 4. Split Section: Recent Quotations Feed & Deal Health Radar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <RecentQuotesTable />
        </div>
        <div className="lg:col-span-4">
          <DealHealthWidget />
        </div>
      </div>

      {/* 5. AI assistance & approvals */}
      <div className="surface-card space-y-5 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              AI assistance
            </h2>
            <p className="text-sm text-muted-foreground">
              Review approvals, discount recommendations, and negotiation
              suggestions in one place.
            </p>
          </div>

          <Link to="/app/approvals">
            <Button size="sm" className="text-xs">
              <ShieldCheck className="mr-1.5 size-3.5" />
              Open approvals
              {pendingCount > 0 && ` (${pendingCount})`}
            </Button>
          </Link>
        </div>

        {/* Tabs */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-1.5 border-b border-border pb-2">
            <button
              type="button"
              onClick={() => setActiveTab("approvals")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                activeTab === "approvals"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
              }`}
            >
              <ShieldCheck className="size-3.5" />
              Approvals
              {pendingCount > 0 && (
                <span className="rounded-full bg-surface/20 px-1.5 py-0.5 font-mono text-xs">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("discount")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                activeTab === "discount"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
              }`}
            >
              <Sliders className="size-3.5" />
              Discount advisor
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("negotiation")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                activeTab === "negotiation"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
              }`}
            >
              <MessageSquare className="size-3.5" />
              Negotiation assistant
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "approvals" && <AiApprovalsInbox />}

          {activeTab === "discount" && (
            <div className="space-y-3">
              <label className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                Quotation ID
                <input
                  type="text"
                  value={sampleQuoteId}
                  onChange={(e) => setSampleQuoteId(e.target.value)}
                  className="rounded-lg border border-border bg-surface px-2.5 py-1 font-mono text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  placeholder="Enter a quotation ID"
                />
              </label>
              <AiReviewPanel quotationId={sampleQuoteId} />
            </div>
          )}

          {activeTab === "negotiation" && (
            <div className="space-y-3">
              <label className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                Request ID
                <input
                  type="text"
                  value={sampleRequestId}
                  onChange={(e) => setSampleRequestId(e.target.value)}
                  className="rounded-lg border border-border bg-surface px-2.5 py-1 font-mono text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  placeholder="Enter a request ID"
                />
              </label>
              <AiNegotiationAssistant requestId={sampleRequestId} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
