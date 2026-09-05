import type { ReportFunnelStage } from "@template/shared";
import { Badge } from "@/components/ui/badge";

interface FunnelTableProps {
  funnel: ReportFunnelStage[];
}

const fmtCurrency = (minor: number) =>
  `$${(minor / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const STAGE_LABELS: Record<
  string,
  {
    label: string;
    tone: "neutral" | "primary" | "warning" | "success" | "danger";
  }
> = {
  DRAFT: { label: "Draft Creation", tone: "neutral" },
  PENDING_APPROVAL: { label: "Pending Approval", tone: "warning" },
  APPROVED: { label: "Approved & Cleared", tone: "success" },
  SENT: { label: "Sent to Customer", tone: "primary" },
  UNDER_NEGOTIATION: { label: "Under Active Negotiation", tone: "warning" },
  CONFIRMED: { label: "Customer Confirmed", tone: "success" },
  FULFILLMENT: { label: "Warehouse Fulfillment", tone: "primary" },
  BILLING: { label: "Billing & Invoicing", tone: "primary" },
  PAID: { label: "Fully Paid & Settled", tone: "success" },
  REJECTED: { label: "Rejected / Withdrawn", tone: "danger" },
};

export function FunnelTable({ funnel }: FunnelTableProps) {
  const maxDeals = Math.max(1, ...funnel.map((f) => f.count));
  const totalNet = Math.max(
    1,
    funnel.reduce((acc, f) => acc + f.netMinor, 0),
  );
  const totalDeals = funnel.reduce((acc, f) => acc + f.count, 0);

  return (
    <div className="surface-card rounded-2xl border border-border overflow-hidden shadow-sm">
      <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-foreground">
            Pipeline Velocity & Funnel
          </h3>
          <p className="text-xs text-muted-foreground">
            Stage-by-stage distribution of deal volume and conversion throughout
            the sales lifecycle.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>
            Active Pipeline:{" "}
            <strong className="text-foreground">{totalDeals}</strong> deals
          </span>
          <span>•</span>
          <span>
            Volume:{" "}
            <strong className="text-foreground">{fmtCurrency(totalNet)}</strong>
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border/80 bg-surface-muted/40 font-semibold text-muted-foreground uppercase tracking-wider">
              <th className="py-3 px-5">Lifecycle Stage</th>
              <th className="py-3 px-5 text-center">Deals Count</th>
              <th className="py-3 px-5">Funnel Proportion</th>
              <th className="py-3 px-5 text-right">Net Value ($)</th>
              <th className="py-3 px-5 text-right">% Volume</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {funnel.map((item) => {
              const stageMeta = STAGE_LABELS[item.status] ?? {
                label: item.status.replace(/_/g, " "),
                tone: "neutral" as const,
              };
              const countWidthPct = (item.count / maxDeals) * 100;
              const netSharePct =
                totalNet > 0 ? (item.netMinor / totalNet) * 100 : 0;

              return (
                <tr
                  key={item.status}
                  className="hover:bg-surface-muted/30 transition-colors"
                >
                  <td className="py-3.5 px-5 font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{stageMeta.label}</span>
                      <span className="text-xs text-muted-foreground font-mono">
                        ({item.status})
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-5 text-center">
                    <Badge
                      tone={stageMeta.tone}
                      className="text-xs font-semibold px-2 py-0.5"
                    >
                      {item.count}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-5 min-w-40">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 rounded-full bg-surface-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${countWidthPct}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground font-mono w-10 text-right">
                        {countWidthPct.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-5 text-right font-mono font-semibold text-foreground">
                    {fmtCurrency(item.netMinor)}
                  </td>
                  <td className="py-3.5 px-5 text-right font-mono text-muted-foreground">
                    {netSharePct.toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
