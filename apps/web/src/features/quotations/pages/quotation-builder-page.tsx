import { useState } from "react";
import { Link, useParams } from "react-router";
import {
  type AddLineInput,
  appRoutes,
  computeTotals,
  type CustomerTier,
} from "@template/shared";
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileSpreadsheet,
  Package,
  Plus,
  Receipt,
  ShieldCheck,
  Truck,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LineEditorTable } from "@/features/quotations/components/line-editor-table";
import { MarginIndicatorGauge } from "@/features/quotations/components/margin-indicator-gauge";
import { OrderDiscountBar } from "@/features/quotations/components/order-discount-bar";
import { ProductPickerModal } from "@/features/quotations/components/product-picker-modal";
import { UpsellPanel } from "@/features/upsell/components/upsell-panel";
import {
  useAddLine,
  useConfirmQuotation,
  useDeleteLine,
  useQuotation,
  useQuotationRisk,
  useUpdateLine,
} from "@/features/quotations/hooks/use-quotations";

export function QuotationBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const { data: quote, isLoading } = useQuotation(id);
  const { data: risk } = useQuotationRisk(id);

  const addLine = useAddLine(id ?? "");
  const updateLine = useUpdateLine(id ?? "");
  const deleteLine = useDeleteLine(id ?? "");
  const confirmQuote = useConfirmQuotation(id ?? "");

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12">
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Skeleton className="h-96 lg:col-span-8" />
          <Skeleton className="h-96 lg:col-span-4" />
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center space-y-3 text-center">
        <FileSpreadsheet className="size-10 text-muted-foreground/50" />
        <h2 className="text-lg font-bold text-foreground">
          Quotation Not Found
        </h2>
        <p className="text-xs text-muted-foreground">
          The requested quotation ID does not exist or has been removed.
        </p>
        <Link to="/app/quotations">
          <Button size="sm" variant="outline">
            <ArrowLeft className="mr-1.5 size-4" /> Return to Quotations
          </Button>
        </Link>
      </div>
    );
  }

  const customerTier: CustomerTier = quote.customer?.tier ?? "BRONZE";
  const liveTotals = computeTotals(quote.lines);
  const isDraft = quote.status === "DRAFT";

  const handleApplyOrderDiscount = (discountPct: number) => {
    for (const line of quote.lines) {
      updateLine.mutate({
        lineId: line.id,
        input: { discountPct },
      });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header with breadcrumb and metadata */}
      <div className="surface-card rounded-xl border border-border p-5 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Link
                className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
                to="/app/quotations"
              >
                <span className="inline-flex items-center gap-1">
                  <ArrowLeft className="size-3" /> Quotations
                </span>
              </Link>
              <span className="text-xs text-muted-foreground">/</span>
              <span className="font-mono text-xs font-bold text-foreground">
                {quote.quotationNumber}
              </span>
              <Badge
                tone={
                  quote.status === "APPROVED"
                    ? "success"
                    : quote.status === "PENDING_APPROVAL"
                      ? "warning"
                      : "primary"
                }
              >
                {quote.status.replace("_", " ")}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 font-semibold text-foreground">
                <User className="size-3.5 text-primary" />
                {quote.customer?.name ?? "Enterprise Client"}
              </span>
              <Badge
                className="text-xs"
                tone={
                  customerTier === "GOLD"
                    ? "primary"
                    : customerTier === "SILVER"
                      ? "secondary"
                      : "warning"
                }
              >
                {customerTier} Tier
              </Badge>
              <span className="flex items-center gap-1">
                <Calendar className="size-3.5" />
                {quote.createdAt
                  ? new Date(quote.createdAt).toLocaleDateString()
                  : "Today"}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" />
                Last updated{" "}
                {quote.lastActivityAt
                  ? new Date(quote.lastActivityAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "recently"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to={appRoutes.quotationFulfillment(quote.id)}>
              <Button size="sm" variant="outline" className="h-9 gap-1.5 rounded-lg text-xs">
                <Truck className="size-3.5" /> Fulfillment
              </Button>
            </Link>

            <Link to={appRoutes.quotationBilling(quote.id)}>
              <Button size="sm" variant="outline" className="h-9 gap-1.5 rounded-lg text-xs">
                <Receipt className="size-3.5" /> Billing
              </Button>
            </Link>

            {isDraft && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => setIsPickerOpen(true)}
                className="h-9 gap-1.5 rounded-lg text-xs"
              >
                <Plus className="size-4" /> Add Product Line
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Split Layout: Left Lines Editor, Right Margin & Risk Gauge */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Left: Lines List & Bulk Controls (8 cols) */}
        <div className="space-y-4 lg:col-span-8">
          <div className="surface-card space-y-4 rounded-xl border border-border p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Package className="size-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">
                  Quotation Line Items ({quote.lines.length})
                </h2>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5 text-success-dark" /> Tier Ceilings
                Active
              </div>
            </div>

            <LineEditorTable
              customerTier={customerTier}
              lines={quote.lines}
              onRemoveLine={(lineId) => deleteLine.mutate(lineId)}
              onUpdateLine={(lineId, patch) =>
                updateLine.mutate({ lineId, input: patch })
              }
            />

            {isDraft && quote.lines.length > 0 && (
              <div className="border-t border-border pt-3">
                <OrderDiscountBar
                  disabled={updateLine.isPending}
                  onApplyAll={handleApplyOrderDiscount}
                />
              </div>
            )}
          </div>

          {/* Intelligent Upsell & Cross-Sell Panel */}
          {isDraft && <UpsellPanel quotationId={quote.id} />}
        </div>

        {/* Right: Margin Indicator & Risk Radar (4 cols) */}
        <div className="sticky top-6 lg:col-span-4">
          <MarginIndicatorGauge
            isConfirming={confirmQuote.isPending}
            liveTotals={liveTotals}
            quote={quote}
            risk={risk}
            onConfirm={() => confirmQuote.mutate()}
          />
        </div>
      </div>

      {/* Product Picker Catalog Modal */}
      <ProductPickerModal
        isAdding={addLine.isPending}
        isOpen={isPickerOpen}
        onAddLine={(input: AddLineInput) => addLine.mutate(input)}
        onClose={() => setIsPickerOpen(false)}
      />
    </div>
  );
}
