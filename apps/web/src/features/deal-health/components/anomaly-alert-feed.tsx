import { useState } from "react";
import { Link } from "react-router";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  PackageX,
  ShieldCheck,
  Sparkles,
  TrendingDown,
} from "lucide-react";
import {
  appRoutes,
  type DealAnomalyType,
  type DealHealthAlert,
  type DealHealthSeverity,
} from "@template/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AnomalyAlertFeedProps {
  alerts: DealHealthAlert[];
  onAcknowledge: (alert: DealHealthAlert) => void;
  onOpenResolveModal: (alert: DealHealthAlert) => void;
  onOpenNudgeModal?: (alert: DealHealthAlert) => void;
}

type FilterTab =
  | "ALL"
  | "CRITICAL"
  | "STALLED"
  | "DISCOUNT"
  | "DELIVERY"
  | "RESOLVED";

export function AnomalyAlertFeed({
  alerts,
  onAcknowledge,
  onOpenResolveModal,
  onOpenNudgeModal,
}: AnomalyAlertFeedProps) {
  const [filterTab, setFilterTab] = useState<FilterTab>("ALL");

  const filteredAlerts = alerts.filter((alert) => {
    switch (filterTab) {
      case "CRITICAL":
        return (
          alert.status === "open" &&
          (alert.severity === "critical" || alert.severity === "high")
        );
      case "STALLED":
        return alert.type === "STALLED" && alert.status === "open";
      case "DISCOUNT":
        return (
          (alert.type === "DISCOUNT_ANOMALY" ||
            alert.type === "MARGIN_EROSION") &&
          alert.status === "open"
        );
      case "DELIVERY":
        return alert.type === "DELIVERY_SLIPPAGE" && alert.status === "open";
      case "RESOLVED":
        return alert.status === "resolved" || alert.status === "acknowledged";
      case "ALL":
      default:
        return alert.status === "open";
    }
  });

  const getAnomalyIcon = (type: DealAnomalyType) => {
    switch (type) {
      case "STALLED":
        return <Clock className="size-4 text-warning" />;
      case "DISCOUNT_ANOMALY":
        return <AlertTriangle className="size-4 text-danger" />;
      case "MARGIN_EROSION":
        return <TrendingDown className="size-4 text-danger" />;
      case "DELIVERY_SLIPPAGE":
        return <PackageX className="size-4 text-primary" />;
    }
  };

  const getSeverityBadge = (severity: DealHealthSeverity) => {
    switch (severity) {
      case "critical":
        return (
          <Badge tone="danger" className="gap-1 font-mono text-xs uppercase">
            <Flame className="size-3" /> Critical
          </Badge>
        );
      case "high":
        return (
          <Badge tone="danger" className="text-xs uppercase font-mono">
            High Severity
          </Badge>
        );
      case "medium":
        return (
          <Badge tone="warning" className="text-xs uppercase font-mono">
            Medium
          </Badge>
        );
      case "low":
      default:
        return (
          <Badge tone="secondary" className="text-xs uppercase font-mono">
            Low
          </Badge>
        );
    }
  };

  return (
    <div className="surface-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <h3 className="text-base font-bold text-foreground">
            Active Anomaly Stream
          </h3>
          <p className="text-xs text-muted-foreground">
            Triage, acknowledge, and resolve real-time deal deviations.
          </p>
        </div>

        {/* Tab Filter */}
        <div className="flex flex-wrap items-center gap-1.5 bg-surface-muted/60 p-1 rounded-xl border border-border">
          <button
            type="button"
            onClick={() => setFilterTab("ALL")}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
              filterTab === "ALL"
                ? "bg-surface text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Open ({alerts.filter((a) => a.status === "open").length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("CRITICAL")}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
              filterTab === "CRITICAL"
                ? "bg-danger text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Critical
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("STALLED")}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
              filterTab === "STALLED"
                ? "bg-surface text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Stalled
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("DISCOUNT")}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
              filterTab === "DISCOUNT"
                ? "bg-surface text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Discount
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("DELIVERY")}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
              filterTab === "DELIVERY"
                ? "bg-surface text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Fulfillment
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("RESOLVED")}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
              filterTab === "RESOLVED"
                ? "bg-surface text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Archived
          </button>
        </div>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <ShieldCheck className="mx-auto size-10 text-muted-foreground/40 mb-2" />
          <h4 className="text-sm font-bold text-foreground">
            No Active Anomalies in this Stream
          </h4>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
            All deals in this filter criteria are operating within expected
            margin, velocity, and stock delegation bounds.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => {
            const isOpen = alert.status === "open";
            const isAcknowledged = alert.status === "acknowledged";

            return (
              <div
                key={alert.id}
                className="rounded-xl border border-border bg-surface-muted/30 p-5 space-y-4 transition-colors hover:border-primary/40"
              >
                {/* Header: Title, Quote Code, Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface border border-border">
                      {getAnomalyIcon(alert.type)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-foreground">
                          {alert.title}
                        </span>
                        {getSeverityBadge(alert.severity)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <Link
                          to={appRoutes.quotationBuilder(alert.quotationId)}
                          className="font-mono font-semibold text-primary hover:underline flex items-center gap-1"
                        >
                          {alert.quotationCode}
                          <ExternalLink className="size-3" />
                        </Link>
                        <span>•</span>
                        <span>{alert.customerName}</span>
                        <span>•</span>
                        <Badge tone="secondary" className="text-xs">
                          {alert.customerTier}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {isAcknowledged ? (
                      <Badge tone="warning" className="text-xs">
                        Acknowledged
                      </Badge>
                    ) : alert.status === "resolved" ? (
                      <Badge tone="success" className="gap-1 text-xs">
                        <CheckCircle2 className="size-3" /> Resolved
                      </Badge>
                    ) : (
                      <Badge tone="danger" className="text-xs">
                        Needs Action
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Narrative Detail */}
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {alert.detail}
                </p>

                {/* Recommended Remediation Callout */}
                <div className="rounded-lg bg-surface border border-border p-3 text-xs flex items-start gap-2.5">
                  <Activity className="size-4 shrink-0 text-primary mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground">
                      Operational Recommendation:{" "}
                    </span>
                    <span className="text-muted-foreground">
                      {alert.recommendedAction}
                    </span>
                  </div>
                </div>

                {/* Resolution note if present */}
                {alert.resolutionNote && (
                  <div className="rounded-lg bg-surface-muted p-2.5 text-xs text-muted-foreground border border-border/60">
                    <span className="font-semibold text-foreground">
                      Audit Log Note:{" "}
                    </span>
                    {alert.resolutionNote}
                  </div>
                )}

                {/* Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-border/70 text-xs">
                  <div className="text-muted-foreground">
                    Rep:{" "}
                    <strong className="text-foreground">
                      {alert.salesRepName}
                    </strong>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link to={appRoutes.quotationBuilder(alert.quotationId)}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 text-xs"
                      >
                        <span>Inspect Quotation</span>
                        <ExternalLink className="size-3" />
                      </Button>
                    </Link>

                    {isOpen && onOpenNudgeModal && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenNudgeModal(alert)}
                        className="h-8 gap-1.5 text-xs font-semibold text-primary border-primary/30 hover:bg-primary/10"
                      >
                        <Sparkles className="size-3" />
                        <span>AI Recovery Nudge</span>
                      </Button>
                    )}

                    {isOpen && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAcknowledge(alert)}
                        className="h-8 text-xs font-medium"
                      >
                        Acknowledge
                      </Button>
                    )}

                    {(isOpen || isAcknowledged) && (
                      <Button
                        size="sm"
                        onClick={() => onOpenResolveModal(alert)}
                        className="h-8 gap-1 text-xs font-semibold"
                      >
                        <CheckCircle2 className="size-3.5" />
                        <span>Resolve Anomaly</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
