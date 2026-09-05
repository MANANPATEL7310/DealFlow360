import {
  CheckCircle2,
  Clock,
  CornerDownRight,
  MessageSquare,
  Sparkles,
  User,
} from "lucide-react";
import type {
  NegotiationRequest,
  PortalQuotationLine,
} from "@template/shared";
import { Badge } from "@/components/ui/badge";

interface PortalHistoryFeedProps {
  negotiations: NegotiationRequest[];
  lines: PortalQuotationLine[];
}

export function PortalHistoryFeed({
  negotiations,
  lines,
}: PortalHistoryFeedProps) {
  const lineMap = new Map(lines.map((l) => [l.id, l]));

  if (negotiations.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-surface-muted text-muted-foreground">
          <MessageSquare className="size-5" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-foreground">
          No Negotiation Records Yet
        </h3>
        <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
          Need a volume concession, payment terms adjustment, or technical clarification?
          Click &quot;Negotiate&quot; above to submit a direct counter-offer.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            Negotiation & Concession Log
          </h2>
          <p className="text-xs text-muted-foreground">
            Audit trail of requested counter-discounts and sales representative resolutions.
          </p>
        </div>
        <Badge tone="secondary" className="font-mono text-xs">
          {negotiations.length} Event{negotiations.length === 1 ? "" : "s"}
        </Badge>
      </div>

      <div className="space-y-6">
        {negotiations.map((neg) => {
          const targetedLine = neg.lineId ? lineMap.get(neg.lineId) : null;
          const targetTitle = targetedLine
            ? `${targetedLine.productName} (Line Item)`
            : "Entire Commercial Proposal";

          const createdDate = new Date(neg.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div
              key={neg.id}
              className="rounded-xl border border-border/80 bg-surface-muted/30 p-4 space-y-3"
            >
              {/* Header row: Target + Status + Timestamp */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">
                    Target: <span className="text-primary">{targetTitle}</span>
                  </span>
                  {neg.counterDiscountPct !== undefined && (
                    <Badge tone="primary" className="text-xs font-mono">
                      Proposed: {neg.counterDiscountPct}%
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs">
                  {neg.status === "ANSWERED" ? (
                    <Badge tone="success" className="gap-1 text-xs">
                      <CheckCircle2 className="size-3" />
                      Concession Answered
                    </Badge>
                  ) : neg.status === "ACCEPTED" ? (
                    <Badge tone="primary" className="gap-1 text-xs">
                      <Sparkles className="size-3" />
                      Approved & Locked
                    </Badge>
                  ) : (
                    <Badge tone="warning" className="gap-1 text-xs">
                      <Clock className="size-3" />
                      Pending Representative Review
                    </Badge>
                  )}
                  <span className="text-muted-foreground">{createdDate}</span>
                </div>
              </div>

              {/* Client note */}
              <div className="flex items-start gap-3 text-xs bg-surface rounded-lg p-3 border border-border/60">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <User className="size-3" />
                </div>
                <div className="space-y-0.5">
                  <div className="font-semibold text-foreground">Client Note</div>
                  <p className="text-muted-foreground leading-relaxed">{neg.comment}</p>
                </div>
              </div>

              {/* Sales Representative response if present */}
              {neg.repComment && (
                <div className="flex items-start gap-3 text-xs bg-primary/5 rounded-lg p-3 border border-primary/20 ml-4">
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <CornerDownRight className="size-3.5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="font-semibold text-primary">Sales Representative Response</div>
                    <p className="text-foreground leading-relaxed">{neg.repComment}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
