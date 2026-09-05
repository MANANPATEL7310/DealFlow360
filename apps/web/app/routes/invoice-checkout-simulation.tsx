import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { AlertCircle, ArrowLeft, Lock, Shield, Zap } from "lucide-react";
import { appRoutes } from "@template/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { paymentGatewayApi } from "@/features/billing/api/payment-gateway-api";

export default function InvoiceCheckoutSimulationPage() {
  const { id: invoiceId = "" } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const amountMinorParam = parseInt(
    searchParams.get("amountMinor") || "10000",
    10,
  );
  const [amountMinor] = useState<number>(
    Number.isNaN(amountMinorParam) ? 10000 : amountMinorParam,
  );

  const [cardNumber] = useState("4242 •••• •••• 4242");
  const [cardholderName, setCardholderName] = useState("Acme Corp Finance");
  const [expiry, setExpiry] = useState("12 / 28");
  const [cvc, setCvc] = useState("842");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSimulatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const res = await paymentGatewayApi.simulateCheckout(
        invoiceId,
        amountMinor,
      );
      if (res.success) {
        navigate(
          `/invoices/${invoiceId}/paid?session_id=sim_settled_${invoiceId}`,
        );
      } else {
        setErrorMessage(
          "Payment simulation was not acknowledged by the gateway.",
        );
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Failed to process simulated payment.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const formattedAmount = (amountMinor / 100).toFixed(2);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 font-sans text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl">
        {/* Top bar with simulation badge */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400">
              <Zap className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">
                Stripe Gateway Simulator
              </h2>
              <p className="text-xs text-slate-400">
                Sandbox Card Authorization Engine
              </p>
            </div>
          </div>
          <Badge tone="warning" className="text-xs uppercase font-mono">
            Test Mode
          </Badge>
        </div>

        {/* Realistic Mock Credit Card */}
        <div className="my-5 relative overflow-hidden rounded-xl border border-white/15 bg-gradient-to-tr from-slate-950 via-slate-900 to-sky-950/80 p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="size-8 rounded-md bg-amber-400/20 border border-amber-400/40" />
            <span className="font-mono text-xs text-slate-400 font-semibold tracking-wider">
              DEBIT / CREDIT
            </span>
          </div>

          <div className="my-4 font-mono text-lg tracking-widest text-slate-200">
            {cardNumber}
          </div>

          <div className="flex items-end justify-between text-xs">
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500">
                Cardholder
              </div>
              <div className="font-medium text-slate-200">{cardholderName}</div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wider text-slate-500">
                Expires
              </div>
              <div className="font-mono text-slate-200">{expiry}</div>
            </div>
          </div>
        </div>

        {/* Invoice Amount Notice */}
        <div className="mb-5 flex items-baseline justify-between rounded-lg border border-white/5 bg-white/5 px-4 py-3 text-xs">
          <span className="text-slate-400">Invoice Reference</span>
          <span className="font-mono text-slate-200 font-medium truncate max-w-xs">
            {invoiceId}
          </span>
        </div>

        {/* Card Form */}
        <form onSubmit={handleSimulatePayment} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Cardholder Name
            </label>
            <Input
              type="text"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              className="border-white/10 bg-slate-950/60 font-sans text-xs text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">
                Expiration
              </label>
              <Input
                type="text"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="border-white/10 bg-slate-950/60 font-mono text-xs text-white"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">
                CVC Code
              </label>
              <Input
                type="text"
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                className="border-white/10 bg-slate-950/60 font-mono text-xs text-white"
                required
              />
            </div>
          </div>

          {errorMessage && (
            <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-2.5 text-xs text-rose-400 flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={isProcessing}
            className="w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-500 h-10 text-xs font-semibold shadow-lg shadow-emerald-950/50"
          >
            {isProcessing ? (
              <>
                <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Settling Transaction...
              </>
            ) : (
              <>
                <Lock className="size-3.5" />
                Authorize & Pay ${formattedAmount} USD
              </>
            )}
          </Button>
        </form>

        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-slate-500">
          <Link
            to={appRoutes.billing}
            className="inline-flex items-center gap-1 hover:text-slate-400 transition-colors"
          >
            <ArrowLeft className="size-3" />
            Cancel and Return
          </Link>
          <span className="inline-flex items-center gap-1">
            <Shield className="size-3 text-emerald-400" />
            256-bit TLS Encrypted
          </span>
        </div>
      </div>
    </div>
  );
}
