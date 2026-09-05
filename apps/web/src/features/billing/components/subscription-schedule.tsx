import { useState } from "react";
import type { Invoice } from "@template/shared";
import { paidMinor, remainingMinor } from "@template/shared";
import {
  Calendar,
  CheckCircle2,
  CreditCard,
  Edit3,
  Repeat,
  Slash,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PaymentModal } from "./payment-modal";
import { SubscriptionChangeModal } from "./subscription-change-modal";

interface SubscriptionScheduleProps {
  lineId: string;
  lineTitle: string;
  periods: Invoice[];
  quotationId: string;
}

export function SubscriptionSchedule({
  lineId,
  lineTitle,
  periods,
  quotationId,
}: SubscriptionScheduleProps) {
  const [selectedInvoiceForPay, setSelectedInvoiceForPay] = useState<Invoice | null>(null);
  const [changeModalMode, setChangeModalMode] = useState<"modify" | "cancel" | null>(null);

  // Current active period (status: ISSUED) or earliest upcoming
  const currentPeriod = periods.find((p) => p.status === "ISSUED") ?? periods[0] ?? null;

  const getStatusBadgeTone = (status: string): "success" | "warning" | "danger" | "neutral" => {
    switch (status) {
      case "PAID":
        return "success";
      case "ISSUED":
        return "warning";
      case "VOID":
        return "danger";
      default:
        return "neutral";
    }
  };

  const isAllVoid = periods.length > 0 && periods.every((p) => p.status === "VOID");

  return (
    <>
      <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-md transition-all hover:border-white/20">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10 text-purple-400">
              <Repeat className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-white">{lineTitle}</h4>
                {isAllVoid ? (
                  <Badge tone="danger" className="text-xs uppercase">
                    Subscription Cancelled
                  </Badge>
                ) : (
                  <Badge tone="primary" className="border-purple-500/30 text-xs text-purple-300 uppercase">
                    Recurring Active
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Line Reference: <span className="font-mono text-slate-300">{lineId}</span>
                {currentPeriod?.amountMinor
                  ? ` • Base: $${(currentPeriod.amountMinor / 100).toFixed(2)}/cycle`
                  : ""}
              </p>
            </div>
          </div>

          {!isAllVoid && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setChangeModalMode("modify")}
                className="gap-1.5 border-white/10 text-xs text-slate-200 hover:bg-white/5"
              >
                <Edit3 className="size-3.5 text-sky-400" />
                Modify Seats / Tier
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setChangeModalMode("cancel")}
                className="gap-1.5 border-rose-500/30 text-xs text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
              >
                <Slash className="size-3.5 text-rose-400" />
                Cancel Plan
              </Button>
            </div>
          )}
        </div>

        {/* Periods Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 font-medium text-slate-400">
                <th className="pb-3 pl-2">Period Range</th>
                <th className="pb-3">Invoice ID</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Paid</th>
                <th className="pb-3">Status</th>
                <th className="pr-2 pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {periods.map((period) => {
                const isVoid = period.status === "VOID";
                const isPaid = period.status === "PAID";
                const isIssued = period.status === "ISSUED";
                const due = remainingMinor(period);
                const paid = paidMinor(period);

                return (
                  <tr
                    key={period.id}
                    className={`transition-colors hover:bg-white/[0.02] ${
                      isVoid ? "text-slate-500 line-through opacity-50" : "text-slate-200"
                    }`}
                  >
                    <td className="py-3 pl-2">
                      <div className="flex items-center gap-1.5 font-mono">
                        <Calendar className="size-3.5 text-slate-400" />
                        <span>
                          {period.periodStart ? period.periodStart.slice(0, 10) : "N/A"} →{" "}
                          {period.periodEnd ? period.periodEnd.slice(0, 10) : "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 font-mono text-xs text-slate-400">
                      {period.id}
                    </td>
                    <td className="py-3 font-mono font-medium">
                      ${(period.amountMinor / 100).toFixed(2)}
                    </td>
                    <td className="py-3 font-mono text-emerald-400">
                      {paid > 0 ? `$${(paid / 100).toFixed(2)}` : "—"}
                    </td>
                    <td className="py-3">
                      <Badge
                        tone={getStatusBadgeTone(period.status)}
                        className="font-mono text-xs uppercase"
                      >
                        {period.status}
                      </Badge>
                    </td>
                    <td className="py-3 pr-2 text-right">
                      {isIssued && due > 0 && (
                        <Button
                          size="sm"
                          onClick={() => setSelectedInvoiceForPay(period)}
                          className="h-7 gap-1 bg-emerald-600 text-xs text-white hover:bg-emerald-500"
                        >
                          <CreditCard className="size-3" />
                          Pay ${(due / 100).toFixed(2)}
                        </Button>
                      )}
                      {isPaid && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                          <CheckCircle2 className="size-3.5" />
                          Settled
                        </span>
                      )}
                      {period.status === "DRAFT" && (
                        <span className="text-xs text-slate-500 italic">
                          Upcoming
                        </span>
                      )}
                      {isVoid && (
                        <span className="text-xs text-rose-400 italic">
                          Voided
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedInvoiceForPay && (
        <PaymentModal
          isOpen={Boolean(selectedInvoiceForPay)}
          onClose={() => setSelectedInvoiceForPay(null)}
          invoice={selectedInvoiceForPay}
          quotationId={quotationId}
          lineTitle={`${lineTitle} (Subscription Cycle)`}
        />
      )}

      {/* Subscription Change / Cancel Modal */}
      {changeModalMode && (
        <SubscriptionChangeModal
          isOpen={Boolean(changeModalMode)}
          onClose={() => setChangeModalMode(null)}
          quotationId={quotationId}
          lineId={lineId}
          lineTitle={lineTitle}
          currentInvoice={currentPeriod}
          initialMode={changeModalMode}
        />
      )}
    </>
  );
}
