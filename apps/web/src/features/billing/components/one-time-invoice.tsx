import { useState } from "react";
import type { Invoice } from "@template/shared";
import { paidMinor, remainingMinor } from "@template/shared";
import {
  CheckCircle2,
  CreditCard,
  FileText,
  Receipt,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PaymentModal } from "./payment-modal";

interface OneTimeInvoiceProps {
  invoice: Invoice;
  quotationId: string;
}

export function OneTimeInvoice({ invoice, quotationId }: OneTimeInvoiceProps) {
  const [isPayOpen, setIsPayOpen] = useState(false);

  const due = remainingMinor(invoice);
  const paid = paidMinor(invoice);
  const total = invoice.amountMinor;
  const pctPaid = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

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

  return (
    <>
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-md transition-all hover:border-white/20">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl border border-sky-500/20 bg-sky-500/10 text-sky-400">
              <Receipt className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-white">One-Time Upfront Charges</h4>
                <Badge
                  tone={getStatusBadgeTone(invoice.status)}
                  className="text-xs uppercase"
                >
                  {invoice.status}
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Invoice ID: <span className="font-mono text-slate-300">{invoice.id}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {invoice.status === "ISSUED" && due > 0 && (
              <Button
                onClick={() => setIsPayOpen(true)}
                size="sm"
                className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-500"
              >
                <CreditCard className="size-4" />
                Record Payment
              </Button>
            )}
            {invoice.status === "PAID" && (
              <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400">
                <CheckCircle2 className="size-4" />
                Fully Settled
              </div>
            )}
          </div>
        </div>

        {/* Financial Metrics */}
        <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/5 bg-white/5 p-3">
            <div className="text-xs text-slate-400">Total Billed</div>
            <div className="font-mono text-lg font-bold text-white">
              ${(total / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/5 p-3">
            <div className="text-xs text-slate-400">Amount Collected</div>
            <div className="font-mono text-lg font-bold text-emerald-400">
              ${(paid / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/5 p-3">
            <div className="text-xs text-slate-400">Remaining Due</div>
            <div className="font-mono text-lg font-bold text-amber-400">
              ${(due / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Payment Progress</span>
            <span className="font-mono">{pctPaid}% Settled</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
              style={{ width: `${pctPaid}%` }}
            />
          </div>
        </div>

        {/* Payments Ledger */}
        {invoice.payments && invoice.payments.length > 0 && (
          <div className="mt-4 space-y-2 border-t border-white/5 pt-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <FileText className="size-3.5 text-slate-400" />
              Recorded Payments ({invoice.payments.length})
            </div>
            <div className="divide-y divide-white/5 rounded-xl border border-white/5 bg-slate-950/40 text-xs">
              {invoice.payments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 text-slate-300"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400">{p.createdAt.slice(0, 10)}</span>
                    <span>•</span>
                    <span className="text-slate-200">{p.paymentMethod}</span>
                    {p.reference && (
                      <span className="font-mono text-xs text-slate-400">
                        ({p.reference})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-emerald-400">
                      +${(p.amountMinor / 100).toFixed(2)}
                    </span>
                    <Badge tone="success" className="border-emerald-500/30 text-xs text-emerald-300 uppercase">
                      {p.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <PaymentModal
        isOpen={isPayOpen}
        onClose={() => setIsPayOpen(false)}
        invoice={invoice}
        quotationId={quotationId}
        lineTitle="One-Time Hardware & Implementation Charges"
      />
    </>
  );
}
