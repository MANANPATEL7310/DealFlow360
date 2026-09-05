import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Download,
  MessageSquarePlus,
  Percent,
  Receipt,
  UserCheck,
} from "lucide-react";
import type { PortalQuotationView } from "@template/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PortalProposalSummaryProps {
  quotation: PortalQuotationView;
  onOpenNegotiate: () => void;
  onOpenConfirm: () => void;
}

export function PortalProposalSummary({
  quotation,
  onOpenNegotiate,
  onOpenConfirm,
}: PortalProposalSummaryProps) {
  const isConfirmed = quotation.status === "CONFIRMED";
  const isPendingApproval = quotation.status === "PENDING_APPROVAL";

  const formattedGrandTotal = (quotation.grandTotalMinor / 100).toLocaleString(
    undefined,
    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
  );

  const formattedSubtotal = (quotation.subtotalMinor / 100).toLocaleString(
    undefined,
    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
  );

  const formattedDiscountTotal = (
    quotation.discountTotalMinor / 100
  ).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formattedTaxTotal = (quotation.taxTotalMinor / 100).toLocaleString(
    undefined,
    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
  );

  const effectiveDiscountPct =
    quotation.subtotalMinor > 0
      ? (
          (quotation.discountTotalMinor / quotation.subtotalMinor) *
          100
        ).toFixed(1)
      : "0.0";

  const expirationDateStr = quotation.expiresAt
    ? new Date(quotation.expiresAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "30 Days from issue";

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Proposal Overview & Details */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold text-primary">
              {quotation.code}
            </span>
            <span className="text-border">•</span>
            <Badge tone="secondary" className="text-xs">
              {quotation.customerTier} Tier Partner
            </Badge>
            <span className="text-border">•</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="size-3.5" />
              Valid until {expirationDateStr}
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Commercial Proposal for {quotation.customerName}
          </h1>

          <p className="max-w-2xl text-sm text-muted-foreground">
            Prepared by <strong className="text-foreground font-semibold">{quotation.salesRepName}</strong>. 
            All pricing includes agreed volume concessions, warranty terms, and service-level commitments.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
            <span className="flex items-center gap-1.5">
              <UserCheck className="size-3.5 text-primary" />
              Designated Contact: {quotation.contactName}
            </span>
            <span className="flex items-center gap-1.5">
              <Receipt className="size-3.5 text-primary" />
              Tax Included ({((quotation.taxTotalMinor / (quotation.subtotalMinor - quotation.discountTotalMinor || 1)) * 100).toFixed(0)}% GST)
            </span>
          </div>
        </div>

        {/* Right: Key Financials & CTAs */}
        <div className="flex flex-col items-start lg:items-end gap-4 rounded-xl border border-border/70 bg-surface-muted/50 p-5 sm:min-w-80">
          <div className="w-full space-y-1 text-left lg:text-right">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Net Total Payable
            </div>
            <div className="font-mono text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              ${formattedGrandTotal}
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 justify-start lg:justify-end">
              <Percent className="size-3.5" />
              <span>
                Total Savings: ${formattedDiscountTotal} ({effectiveDiscountPct}%)
              </span>
            </div>
          </div>

          {/* Breakdown summary row */}
          <div className="grid grid-cols-2 gap-3 w-full border-t border-border pt-3 text-xs">
            <div>
              <span className="text-muted-foreground">List Subtotal:</span>{" "}
              <span className="font-mono font-medium text-foreground">${formattedSubtotal}</span>
            </div>
            <div className="text-right">
              <span className="text-muted-foreground">Estimated Tax:</span>{" "}
              <span className="font-mono font-medium text-foreground">${formattedTaxTotal}</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2 w-full pt-1">
            {isConfirmed ? (
              <div className="flex items-center gap-2 w-full justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 py-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-4" />
                <span>Proposal Formally Confirmed</span>
              </div>
            ) : isPendingApproval ? (
              <div className="flex items-center gap-2 w-full justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 py-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
                <span>Under Executive Review</span>
              </div>
            ) : (
              <>
                <Button
                  onClick={onOpenConfirm}
                  size="md"
                  className="flex-1 gap-1.5 font-semibold shadow-sm"
                >
                  <span>Accept Proposal</span>
                  <ArrowRight className="size-4" />
                </Button>

                <Button
                  onClick={onOpenNegotiate}
                  variant="outline"
                  size="md"
                  className="gap-1.5"
                >
                  <MessageSquarePlus className="size-4 text-primary" />
                  <span>Negotiate</span>
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground hover:text-foreground"
              onClick={() => window.print()}
            >
              <Download className="mr-1.5 size-3.5" />
              Print / Save PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
