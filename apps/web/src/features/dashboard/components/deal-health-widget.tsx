import { Link } from "react-router";
import {
  Activity,
  AlertTriangle,
  Clock,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { appRoutes } from "@template/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDealHealthAlerts,
  useAcknowledgeAlert,
} from "../hooks/use-dashboard-data";
import type { DealHealthAlertItem } from "../api/dashboard-api";

export function DealHealthWidget() {
  const { data: alerts, isLoading } = useDealHealthAlerts();
  const acknowledgeMutation = useAcknowledgeAlert();

  const getSeverityStyle = (severity: DealHealthAlertItem["severity"]) => {
    switch (severity) {
      case "high":
        return "border-danger/30 bg-danger/10 text-danger";
      case "medium":
        return "border-warning/30 bg-warning/10 text-warning";
      case "low":
      default:
        return "border-primary/30 bg-primary/10 text-primary";
    }
  };

  const getAlertIcon = (type: DealHealthAlertItem["type"]) => {
    switch (type) {
      case "STALLED":
        return <Clock className="size-4 shrink-0 text-warning" />;
      case "DISCOUNT_ANOMALY":
        return <AlertTriangle className="size-4 shrink-0 text-danger" />;
      case "DELIVERY_SLIPPAGE":
        return <Activity className="size-4 shrink-0 text-primary" />;
    }
  };

  const openAlerts = alerts?.filter((a) => a.status === "open") ?? [];

  return (
    <div className="surface-card flex flex-col justify-between p-5">
      <div>
        <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-warning/10 text-warning">
              <Activity className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground sm:text-base">
                Deal Health Radar
              </h2>
              <p className="text-xs text-muted-foreground">
                Autonomous anomaly detection
              </p>
            </div>
          </div>

          <Link to={appRoutes.dealHealth}>
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              <span>Radar</span>
              <ExternalLink className="size-3.5" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="space-y-2 rounded-xl border border-border bg-surface-muted/30 p-3"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-12 rounded-full" />
                </div>
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        ) : openAlerts.length === 0 ? (
          <div className="my-auto rounded-xl border border-secondary/25 bg-secondary/5 p-5 text-center">
            <div className="mx-auto mb-2.5 flex size-10 items-center justify-center rounded-full bg-secondary/15 text-secondary">
              <ShieldCheck className="size-5" />
            </div>
            <h3 className="text-xs font-bold text-foreground">
              All Deals Healthy
            </h3>
            <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
              Zero margin erosions, stalled quotations, or warehouse slippages detected.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {openAlerts.slice(0, 4).map((alert) => (
              <div
                key={alert.id}
                className="rounded-xl border border-border bg-surface-muted/30 p-3 text-xs transition-all hover:bg-surface-muted/50"
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {getAlertIcon(alert.type)}
                    <span className="font-mono font-bold text-foreground">
                      {alert.quotationCode}
                    </span>
                  </div>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-bold uppercase ${getSeverityStyle(
                      alert.severity,
                    )}`}
                  >
                    {alert.severity}
                  </span>
                </div>

                <p className="mb-2.5 text-xs leading-relaxed text-muted-foreground">
                  {alert.detail}
                </p>

                <div className="flex items-center justify-between border-t border-border/60 pt-2 text-xs">
                  <span className="max-w-28 truncate text-muted-foreground">
                    {alert.customerName}
                  </span>
                  <button
                    type="button"
                    disabled={acknowledgeMutation.isPending}
                    onClick={() => acknowledgeMutation.mutate(alert.id)}
                    className="inline-flex cursor-pointer items-center gap-1 font-semibold text-primary hover:text-primary-dark disabled:opacity-50"
                  >
                    <CheckCircle className="size-3.5" />
                    <span>Acknowledge</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
        <span>Active Alerts:</span>
        <span className="font-bold text-foreground">
          {openAlerts.length} Flagged
        </span>
      </div>
    </div>
  );
}

export default DealHealthWidget;
