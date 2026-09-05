import { useState } from "react";
import type { Invoice } from "@template/shared";
import { paidMinor, remainingMinor } from "@template/shared";
import {
  CheckCircle,
  CreditCard,
  DollarSign,
  ExternalLink,
  Loader2,
  Receipt,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRecordPayment } from "../hooks/use-billing";
import {
  useCreateCheckoutSession,
  useSimulateCheckout,
} from "../hooks/use-payment-gateway";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  quotationId: string;
  lineTitle?: string;
}

function PaymentModalContent({
  onClose,
  invoice,
  quotationId,
  lineTitle,
}: {
  onClose: () => void;
  invoice: Invoice;
  quotationId: string;
  lineTitle?: string;
}) {
  const [activeTab, setActiveTab] = useState<"gateway" | "manual">("gateway");

  const recordPayment = useRecordPayment(quotationId);
  const createCheckoutSession = useCreateCheckoutSession(quotationId);
  const simulateCheckout = useSimulateCheckout(quotationId);

  const dueMinor = remainingMinor(invoice);
  const totalMinor = invoice.amountMinor;
  const alreadyPaidMinor = paidMinor(invoice);

  // Manual payment state
  const [amountDollars, setAmountDollars] = useState<string>(() =>
    (dueMinor / 100).toFixed(2),
  );
  const [paymentMethod, setPaymentMethod] = useState<string>("ACH Transfer");
  const [reference, setReference] = useState<string>(
    () => `REF-${Math.floor(100000 + Math.random() * 900000)}`,
  );
  const [error, setError] = useState<string | null>(null);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = parseFloat(amountDollars);
    if (Number.isNaN(parsed) || parsed <= 0) {
      setError("Please enter a valid positive payment amount.");
      return;
    }

    const inputMinor = Math.round(parsed * 100);
    if (inputMinor > dueMinor) {
      setError(
        `Payment amount cannot exceed remaining balance of $${(dueMinor / 100).toFixed(2)}.`,
      );
      return;
    }

    try {
      await recordPayment.mutateAsync({
        invoiceId: invoice.id,
        amountMinor: inputMinor,
        paymentMethod,
        reference: reference.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to record payment.";
      setError(msg);
    }
  };

  const handleLaunchStripeCheckout = async () => {
    setError(null);
    try {
      const res = await createCheckoutSession.mutateAsync({
        invoiceId: invoice.id,
      });

      if (res.mode === "simulation" && res.checkoutUrl) {
        // If simulation checkout URL is provided, open local simulation route
        window.location.href = res.checkoutUrl;
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to initialize Stripe checkout session.";
      setError(msg);
    }
  };

  const handleSimulateInstantSettlement = async () => {
    setError(null);
    try {
      await simulateCheckout.mutateAsync({
        invoiceId: invoice.id,
        amountMinor: dueMinor,
      });
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to simulate payment settlement.";
      setError(msg);
    }
  };

  const setFullAmount = () => {
    setAmountDollars((dueMinor / 100).toFixed(2));
    setError(null);
  };

  const isPending =
    recordPayment.isPending ||
    createCheckoutSession.isPending ||
    simulateCheckout.isPending;

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
              <CreditCard className="size-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Invoice Payment Gateway
              </h3>
              <p className="text-xs text-slate-400">
                Invoice{" "}
                <span className="font-mono text-slate-300">{invoice.id}</span>
                {lineTitle ? ` • ${lineTitle}` : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Invoice Summary Card */}
        <div className="my-4 space-y-3 rounded-xl border border-white/5 bg-white/5 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Invoice Type & Status</span>
            <div className="flex items-center gap-2">
              <Badge tone="neutral" className="text-xs uppercase">
                {invoice.kind}
              </Badge>
              <Badge
                tone={
                  invoice.status === "PAID"
                    ? "success"
                    : invoice.status === "ISSUED"
                      ? "warning"
                      : "neutral"
                }
                className="text-xs uppercase"
              >
                {invoice.status}
              </Badge>
            </div>
          </div>

          {invoice.periodStart && invoice.periodEnd && (
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Billing Period</span>
              <span className="font-mono text-slate-300">
                {invoice.periodStart.slice(0, 10)} →{" "}
                {invoice.periodEnd.slice(0, 10)}
              </span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-2 text-center">
            <div>
              <div className="text-xs text-slate-400">Total Billed</div>
              <div className="text-sm font-semibold text-white">
                ${(totalMinor / 100).toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Already Paid</div>
              <div className="text-sm font-semibold text-emerald-400">
                ${(alreadyPaidMinor / 100).toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Balance Due</div>
              <div className="text-sm font-semibold text-amber-400">
                ${(dueMinor / 100).toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="mb-4 grid grid-cols-2 rounded-lg bg-slate-950/60 p-1 border border-white/10 text-xs font-medium text-slate-400">
          <button
            type="button"
            onClick={() => setActiveTab("gateway")}
            className={`flex items-center justify-center gap-1.5 rounded-md py-2 transition-all ${
              activeTab === "gateway"
                ? "bg-emerald-500/20 text-emerald-300 font-semibold shadow-xs"
                : "hover:text-slate-200"
            }`}
          >
            <Sparkles className="size-3.5 text-emerald-400" />
            Stripe Gateway & Simulation
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`flex items-center justify-center gap-1.5 rounded-md py-2 transition-all ${
              activeTab === "manual"
                ? "bg-white/10 text-white font-semibold shadow-xs"
                : "hover:text-slate-200"
            }`}
          >
            <Receipt className="size-3.5 text-slate-400" />
            Manual Ledger Log
          </button>
        </div>

        {/* Tab 1: Stripe Online Gateway */}
        {activeTab === "gateway" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Zap className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-emerald-300">
                      Automated Payment Gateway
                    </h4>
                    <p className="text-xs text-slate-400">
                      Processes credit card transactions with instant
                      reconciliation
                    </p>
                  </div>
                </div>
                <Badge
                  tone="success"
                  className="text-xs tracking-wider uppercase"
                >
                  Active Gateway
                </Badge>
              </div>

              <div className="mt-3 flex items-baseline justify-between border-t border-emerald-500/15 pt-2">
                <span className="text-xs text-slate-400">Payable Balance</span>
                <span className="text-base font-bold font-mono text-white">
                  ${(dueMinor / 100).toFixed(2)}{" "}
                  <span className="text-xs font-normal text-slate-400">
                    USD
                  </span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <Button
                type="button"
                onClick={handleLaunchStripeCheckout}
                disabled={isPending || dueMinor <= 0}
                className="gap-2 bg-sky-600 text-white hover:bg-sky-500 h-10 text-xs"
              >
                {createCheckoutSession.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Opening Checkout...
                  </>
                ) : (
                  <>
                    <ExternalLink className="size-4" />
                    Launch Stripe Checkout
                  </>
                )}
              </Button>

              <Button
                type="button"
                onClick={handleSimulateInstantSettlement}
                disabled={isPending || dueMinor <= 0}
                className="gap-2 bg-emerald-600 text-white hover:bg-emerald-500 h-10 text-xs"
              >
                {simulateCheckout.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Settling Card...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Simulate Settlement
                  </>
                )}
              </Button>
            </div>

            <p className="text-center text-xs text-slate-500">
              * Supports dual-mode: live Stripe checkout if keys are configured,
              or automated sandbox settlement.
            </p>
          </div>
        )}

        {/* Tab 2: Manual Offline Entry */}
        {activeTab === "manual" && (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">
                  Payment Amount ($ USD)
                </label>
                <button
                  type="button"
                  onClick={setFullAmount}
                  className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
                >
                  Pay Full Balance (${(dueMinor / 100).toFixed(2)})
                </button>
              </div>
              <div className="relative">
                <DollarSign className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={(dueMinor / 100).toFixed(2)}
                  value={amountDollars}
                  onChange={(e) => setAmountDollars(e.target.value)}
                  className="border-white/10 bg-slate-950/60 pl-9 font-mono text-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-9 w-full rounded-md border border-white/10 bg-slate-950/60 px-3 text-xs text-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="ACH Transfer">ACH Transfer</option>
                  <option value="Wire Transfer">Wire Transfer</option>
                  <option value="Corporate Card">Corporate Card</option>
                  <option value="Check">Corporate Check</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300">
                  Reference / Transaction ID
                </label>
                <Input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. WIRE-88492"
                  className="border-white/10 bg-slate-950/60 font-mono text-xs text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={recordPayment.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={recordPayment.isPending || dueMinor <= 0}
                className="bg-emerald-600 text-white hover:bg-emerald-500"
              >
                {recordPayment.isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Logging...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 size-4" />
                    Confirm Manual Payment
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {error && (
          <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-2.5 text-xs text-red-400">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export function PaymentModal({
  isOpen,
  onClose,
  invoice,
  quotationId,
  lineTitle,
}: PaymentModalProps) {
  if (!isOpen || !invoice) return null;

  return (
    <PaymentModalContent
      key={invoice.id}
      onClose={onClose}
      invoice={invoice}
      quotationId={quotationId}
      lineTitle={lineTitle}
    />
  );
}
