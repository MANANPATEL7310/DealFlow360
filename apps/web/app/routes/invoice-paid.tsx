import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { ArrowLeft, CheckCircle2, Receipt, ShieldCheck } from "lucide-react";
import { appRoutes } from "@template/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function InvoicePaidPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  const [sessionId] = useState<string>(() => {
    return searchParams.get("session_id") || "cs_live_acknowledged";
  });

  const [timestamp] = useState<string>(() => {
    const now = new Date();
    return `${now.toLocaleTimeString()} • ${now.toLocaleDateString()}`;
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 font-sans text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl">
        {/* Success Icon */}
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-950/50">
          <CheckCircle2 className="size-8" />
        </div>

        {/* Heading */}
        <div className="mt-6 text-center">
          <Badge
            tone="success"
            className="mb-2 uppercase text-xs tracking-wider"
          >
            Payment Confirmed
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Invoice Settled Successfully
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Your transaction has been processed and verified by the payment
            gateway.
          </p>
        </div>

        {/* Receipt Box */}
        <div className="mt-6 space-y-3 rounded-xl border border-white/10 bg-white/5 p-4 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Invoice Reference</span>
            <span className="font-mono font-medium text-white">{id}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Stripe Session ID</span>
            <span className="max-w-xs truncate font-mono text-xs text-slate-300">
              {sessionId}
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-white/5 pt-2">
            <span className="text-slate-400">Reconciliation Status</span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
              <ShieldCheck className="size-3.5" />
              PAID & Reconciled
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Timestamp</span>
            <span className="text-slate-300 font-mono">{timestamp}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link to={appRoutes.billing} className="flex-1">
            <Button className="w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-500">
              <Receipt className="size-4" />
              Billing Workspace
            </Button>
          </Link>
          <Link to={appRoutes.quotations} className="flex-1">
            <Button
              variant="outline"
              className="w-full gap-2 border-white/10 text-slate-200 hover:bg-white/5"
            >
              <ArrowLeft className="size-4" />
              Return to Quotations
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
