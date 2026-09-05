import { useState } from "react";
import {
  Sparkles,
  Percent,
  Receipt,
  Mail,
  Scale,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ApprovalRequest, ApprovalRequestKind } from "@template/shared";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

function formatMinor(cents: number, _currency = "USD") {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

interface HitlApprovalCardProps {
  request: ApprovalRequest;
  onDecide: (
    id: string,
    decision: "APPROVED" | "REJECTED",
    reason?: string,
  ) => Promise<void>;
  isProcessing?: boolean;
}

const kindMeta: Record<
  ApprovalRequestKind,
  { label: string; icon: typeof Percent; badgeClass: string }
> = {
  DISCOUNT: {
    label: "Discount Exception",
    icon: Percent,
    badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-500",
  },
  CREDIT_NOTE: {
    label: "Credit Note Proposal",
    icon: Receipt,
    badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
  },
  NUDGE: {
    label: "Outbound Deal Nudge",
    icon: Mail,
    badgeClass: "border-blue-500/30 bg-blue-500/10 text-blue-500",
  },
  NEGOTIATION: {
    label: "Portal Counter-Offer",
    icon: Scale,
    badgeClass: "border-purple-500/30 bg-purple-500/10 text-purple-500",
  },
  FULFILLMENT_OVERRIDE: {
    label: "Fulfillment Allocation",
    icon: Truck,
    badgeClass: "border-cyan-500/30 bg-cyan-500/10 text-cyan-500",
  },
};

export function HitlApprovalCard({
  request,
  onDecide,
  isProcessing = false,
}: HitlApprovalCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [rejectPromptOpen, setRejectPromptOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const meta = kindMeta[request.kind] ?? {
    label: request.kind,
    icon: ShieldAlert,
    badgeClass: "border-border bg-muted text-foreground",
  };
  const Icon = meta.icon;

  const handleApprove = async () => {
    await onDecide(request.id, "APPROVED");
  };

  const handleReject = async () => {
    await onDecide(
      request.id,
      "REJECTED",
      rejectReason || "Rejected by reviewer",
    );
    setRejectPromptOpen(false);
  };

  const isPending = request.status === "PENDING";
  const actionObj = request.proposedAction as Record<
    string,
    string | number | boolean | null | undefined
  >;

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/80 bg-card/60 p-4 shadow-sm transition-all hover:border-border hover:shadow-md backdrop-blur-xs">
      {/* Header Bar */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold ${meta.badgeClass}`}
          >
            <Icon className="size-3" />
            {meta.label}
          </span>
          <span className="rounded bg-muted/60 px-1.5 py-0.5 font-mono text-xs text-muted-foreground uppercase">
            {request.agent.replace("-", " ")}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3" />
          <span>{dayjs(request.createdAt).fromNow()}</span>
        </div>
      </div>

      {/* Main Details */}
      <div className="mt-3 space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <h4 className="text-sm font-semibold text-foreground">
            {request.customerName ?? "Enterprise Account"}
          </h4>
          {request.quotationNumber && (
            <span className="inline-flex items-center gap-1 font-mono text-xs font-medium text-primary">
              {request.quotationNumber}
              <ExternalLink className="size-2.5 opacity-60" />
            </span>
          )}
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {request.summary}
        </p>
      </div>

      {/* AI Rationale Snippet */}
      {request.rationale && (
        <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-2.5 text-xs text-foreground/90">
          <div className="flex items-center gap-1.5 font-semibold text-primary text-xs mb-1">
            <Sparkles className="size-3" />
            <span>AI Reasoning & Governance Pre-Check</span>
          </div>
          <p className="text-muted-foreground text-xs leading-normal">
            {request.rationale}
          </p>
        </div>
      )}

      {/* Key Metric Highlights based on Action Kind */}
      <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-2 text-xs">
        {request.kind === "DISCOUNT" && (
          <>
            <div>
              <span className="text-xs text-muted-foreground uppercase">
                Requested
              </span>
              <p className="font-semibold text-amber-500">
                {actionObj.requestedDiscountPct ?? 0}%
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase">
                Policy Ceiling
              </span>
              <p className="font-semibold text-foreground">
                {actionObj.policyCeilingPct ?? 0}%
              </p>
            </div>
          </>
        )}

        {request.kind === "CREDIT_NOTE" && (
          <>
            <div>
              <span className="text-xs text-muted-foreground uppercase">
                Credit Amount
              </span>
              <p className="font-semibold text-emerald-500">
                {formatMinor(
                  Number(actionObj.amountMinor) || 0,
                  String(actionObj.currency || "USD"),
                )}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase">
                Source Invoice
              </span>
              <p className="font-mono text-xs text-foreground uppercase">
                {String(actionObj.sourceInvoiceId || "N/A")}
              </p>
            </div>
          </>
        )}

        {request.kind === "NEGOTIATION" && (
          <>
            <div>
              <span className="text-xs text-muted-foreground uppercase">
                Customer Ask
              </span>
              <p className="font-semibold text-rose-500">
                {actionObj.customerRequestedDiscountPct ?? 0}%
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase">
                Proposed Counter
              </span>
              <p className="font-semibold text-purple-400">
                {actionObj.proposedCounterDiscountPct ?? 0}%
              </p>
            </div>
          </>
        )}

        {request.kind === "FULFILLMENT_OVERRIDE" && (
          <>
            <div>
              <span className="text-xs text-muted-foreground uppercase">
                Units Shifted
              </span>
              <p className="font-semibold text-cyan-400">
                {actionObj.unitsShifted ?? 0} units
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase">
                Est. Freight Cost
              </span>
              <p className="font-semibold text-foreground">
                {formatMinor(
                  Number(actionObj.incrementalShippingCostMinor) || 0,
                  "USD",
                )}
              </p>
            </div>
          </>
        )}

        {request.kind === "NUDGE" && (
          <>
            <div>
              <span className="text-xs text-muted-foreground uppercase">
                Channel
              </span>
              <p className="font-semibold text-blue-400">
                {String(actionObj.channel || "Email")}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase">
                Recipient
              </span>
              <p className="truncate font-mono text-xs text-foreground">
                {String(actionObj.recipient || "Customer Rep")}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Expandable Full Payload View */}
      {isExpanded && (
        <div className="mt-3 space-y-2 rounded-lg border border-border/60 bg-muted/20 p-2.5 text-xs">
          <div className="font-mono text-xs text-muted-foreground uppercase">
            Proposed Action Payload
          </div>
          {actionObj.draftBody ? (
            <div className="rounded border border-border/80 bg-background/80 p-2 text-xs text-foreground whitespace-pre-wrap">
              {String(actionObj.draftBody)}
            </div>
          ) : (
            <pre className="max-h-36 overflow-auto rounded bg-background/80 p-2 font-mono text-xs text-muted-foreground">
              {JSON.stringify(request.proposedAction, null, 2)}
            </pre>
          )}
        </div>
      )}

      {/* Expand Toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="mt-2 flex w-full items-center justify-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        {isExpanded ? (
          <>
            Hide Details <ChevronUp className="size-3" />
          </>
        ) : (
          <>
            Show Proposed Payload <ChevronDown className="size-3" />
          </>
        )}
      </button>

      {/* Reject Reason Prompt */}
      {rejectPromptOpen && (
        <div className="mt-3 space-y-2 rounded-lg border border-rose-500/30 bg-rose-500/5 p-3">
          <label className="block text-xs font-medium text-rose-500">
            Reason for rejection (audit requirement):
          </label>
          <input
            type="text"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Terms exceed current quarter margin policy"
            className="w-full rounded border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
          />
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRejectPromptOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReject}
              disabled={isProcessing}
              className="text-xs text-rose-500 border-rose-500/40 hover:bg-rose-500/10"
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
        {isPending ? (
          <div className="flex w-full items-center justify-end gap-2">
            {!rejectPromptOpen && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRejectPromptOpen(true)}
                disabled={isProcessing}
                className="gap-1.5 text-xs text-destructive hover:bg-destructive/10"
              >
                <XCircle className="size-3.5" />
                Reject
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleApprove}
              disabled={isProcessing}
              className="gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <CheckCircle2 className="size-3.5" />
              {isProcessing ? "Executing..." : "Approve & Execute"}
            </Button>
          </div>
        ) : (
          <div className="flex w-full items-center justify-between">
            <span
              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold ${
                request.status === "APPROVED"
                  ? "bg-emerald-500/20 text-emerald-500"
                  : "bg-rose-500/20 text-rose-500"
              }`}
            >
              {request.status === "APPROVED" ? (
                <CheckCircle2 className="size-3.5" />
              ) : (
                <XCircle className="size-3.5" />
              )}
              {request.status}
            </span>
            <span className="text-xs text-muted-foreground">
              By {request.decidedBy ?? "reviewer"}{" "}
              {request.decidedAt ? dayjs(request.decidedAt).fromNow() : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
