import type { QuotationStatus, QuotationStatusEvent } from "@template/shared";
import { ArrowRight, Clock, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface AuditTimelineProps {
  events: QuotationStatusEvent[];
}

function getStatusBadge(status: QuotationStatus) {
  switch (status) {
    case "DRAFT":
      return <Badge tone="neutral">Draft</Badge>;
    case "PENDING_APPROVAL":
      return <Badge tone="warning">Pending Review</Badge>;
    case "APPROVED":
      return <Badge tone="success">Approved</Badge>;
    case "SENT":
      return <Badge tone="primary">Sent</Badge>;
    case "UNDER_NEGOTIATION":
      return <Badge tone="warning">Negotiating</Badge>;
    case "CONFIRMED":
      return <Badge tone="primary">Confirmed</Badge>;
    case "REJECTED":
      return <Badge tone="danger">Rejected</Badge>;
    default:
      return <Badge tone="neutral">{status}</Badge>;
  }
}

export function AuditTimeline({ events }: AuditTimelineProps) {
  // Sort events newest first for audit inspection
  const sortedEvents = [...events].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  return (
    <Card className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="size-5 text-primary" />
          <h3 className="text-base font-bold text-foreground">
            Governance & Status Audit Trail
          </h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {events.length} Historical Event{events.length === 1 ? "" : "s"}
        </span>
      </div>

      {sortedEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
          <Clock className="mb-2 size-6 opacity-40" />
          No status transitions recorded yet.
        </div>
      ) : (
        <div className="relative space-y-6 pl-6 before:absolute before:inset-y-2 before:left-2.5 before:w-0.5 before:bg-border">
          {sortedEvents.map((event) => {
            const formattedDate = event.createdAt
              ? new Date(event.createdAt).toLocaleString()
              : "Historical event";

            return (
              <div key={event.id} className="relative space-y-1.5">
                {/* Timeline Dot */}
                <div className="bg-card absolute -left-6 flex size-5 -translate-x-1/2 items-center justify-center rounded-full border-2 border-primary text-primary">
                  <div className="size-1.5 rounded-full bg-primary" />
                </div>

                {/* Transition Header */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    {getStatusBadge(event.fromStatus)}
                    <ArrowRight className="size-3 text-muted-foreground" />
                    {getStatusBadge(event.toStatus)}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formattedDate}
                  </span>
                </div>

                {/* Actor & Reason info */}
                <div className="rounded-xl border border-border bg-surface-muted/30 p-2.5 text-xs">
                  <div className="flex items-center justify-between font-medium text-foreground">
                    <span>Actor: {event.actorId || "System Engine"}</span>
                  </div>
                  {event.reason && (
                    <p className="mt-1 text-muted-foreground italic">
                      "{event.reason}"
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
