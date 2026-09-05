import { Link, useParams } from "react-router";
import {
  appRoutes,
  groupInvoices,
  paidMinor,
  remainingMinor,
} from "@template/shared";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CreditCard,
  FileSpreadsheet,
  Receipt,
  Repeat,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleGuard } from "@/features/auth/routes/role-guard";
import {
  useQuotation,
  useQuotations,
} from "@/features/quotations/hooks/use-quotations";
import { BillingStats } from "../components/billing-stats";
import { CreditNotesList } from "../components/credit-notes-list";
import { OneTimeInvoice } from "../components/one-time-invoice";
import { SubscriptionSchedule } from "../components/subscription-schedule";
import {
  useAllBillingSchedules,
  useBillingSchedule,
} from "../hooks/use-billing";

export function BillingPage() {
  const { id } = useParams<{ id: string }>();

  // If specific quotation ID is provided, render quotation billing workbench
  if (id) {
    return <QuotationBillingWorkspace quotationId={id} />;
  }

  // Otherwise, render platform-wide Billing Operations Command Center
  return <BillingOperationsOverview />;
}

// ─── Quotation-Specific Billing Workspace (B7 Screen) ─────────────────────────

function QuotationBillingWorkspace({ quotationId }: { quotationId: string }) {
  const { data: quote, isLoading: isQuoteLoading } = useQuotation(quotationId);
  const { data: schedule, isLoading: isScheduleLoading } =
    useBillingSchedule(quotationId);

  const isLoading = isQuoteLoading || isScheduleLoading;

  if (isLoading) {
    return (
      <RoleGuard
        allowedRoles={["sales_rep", "sales_manager", "finance", "admin"]}
      >
        <div className="space-y-6 pb-12">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-28 w-full" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </RoleGuard>
    );
  }

  if (!schedule) {
    return (
      <RoleGuard
        allowedRoles={["sales_rep", "sales_manager", "finance", "admin"]}
      >
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-12 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-white/5 text-slate-400">
            <Receipt className="size-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-white">
            No Billing Schedule Found
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Confirm the quotation or submit it to fulfillment to generate a
            hybrid billing schedule.
          </p>
          <div className="mt-6">
            <Link to={appRoutes.quotationBuilder(quotationId)}>
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="size-4" />
                Return to Quotation
              </Button>
            </Link>
          </div>
        </div>
      </RoleGuard>
    );
  }

  const { oneTime, recurring } = groupInvoices(schedule.invoices);

  // Helper to resolve product name for a recurring quotation line
  const resolveLineTitle = (lineId: string) => {
    const line = quote?.lines.find((l) => l.id === lineId);
    if (line?.product?.name) {
      return line.product.name;
    }
    return `Subscription Line (${lineId})`;
  };

  const getQuoteStatusTone = (
    status?: string,
  ): "success" | "warning" | "danger" | "neutral" => {
    switch (status) {
      case "PAID":
        return "success";
      case "CONFIRMED":
      case "FULFILLMENT":
      case "BILLING":
        return "warning";
      default:
        return "neutral";
    }
  };

  return (
    <RoleGuard
      allowedRoles={["sales_rep", "sales_manager", "finance", "admin"]}
    >
      <div className="space-y-6 pb-12">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to={appRoutes.quotationBuilder(quotationId)}
            className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to Quotation {quote?.quotationNumber ?? quotationId}
          </Link>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 text-emerald-500" />
            <span>Audited Billing Engine (M4)</span>
          </div>
        </div>

        {/* Quotation Header Banner */}
        <div className="surface-card p-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Hybrid Billing Workspace
                </h1>
                <Badge
                  tone={getQuoteStatusTone(quote?.status)}
                  className="font-mono text-xs uppercase"
                >
                  Order: {quote?.status ?? "CONFIRMED"}
                </Badge>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <FileSpreadsheet className="size-4 text-muted-foreground" />
                  <span className="font-mono text-foreground">
                    {quote?.quotationNumber ?? quotationId}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Building2 className="size-4 text-muted-foreground" />
                  <span className="text-foreground">
                    {quote?.customer?.name ?? "Customer Account"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Receipt className="size-4 text-muted-foreground" />
                  <span className="font-mono text-muted-foreground">
                    Schedule: {schedule.id}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link to={appRoutes.quotationFulfillment(quotationId)}>
                <Button variant="outline" size="sm" className="text-xs">
                  View Fulfillment
                </Button>
              </Link>
              <Link to={appRoutes.billing}>
                <Button variant="outline" size="sm" className="text-xs">
                  All Schedules
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Metric Cards */}
        <BillingStats schedule={schedule} isLoading={isLoading} />

        {/* Section 1: Upfront One-Time Charges */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Receipt className="size-4 text-sky-500" />
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              1. Upfront One-Time Invoicing
            </h2>
          </div>
          {oneTime ? (
            <OneTimeInvoice invoice={oneTime} quotationId={quotationId} />
          ) : (
            <div className="surface-card p-5 text-xs text-muted-foreground">
              No one-time hardware or professional services charges on this
              order.
            </div>
          )}
        </div>

        {/* Section 2: Recurring Subscription Schedules */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Repeat className="size-4 text-purple-500" />
              <h2 className="text-base font-semibold tracking-tight text-foreground">
                2. Recurring Subscription Schedules
              </h2>
            </div>
            <span className="text-xs text-muted-foreground">
              {recurring.size} Active Recurring Line
              {recurring.size === 1 ? "" : "s"}
            </span>
          </div>

          {recurring.size === 0 ? (
            <div className="surface-card p-5 text-xs text-muted-foreground">
              No recurring SaaS subscription line items configured for this
              order.
            </div>
          ) : (
            <div className="space-y-4">
              {[...recurring.entries()].map(([lineId, periods]) => (
                <SubscriptionSchedule
                  key={lineId}
                  lineId={lineId}
                  lineTitle={resolveLineTitle(lineId)}
                  periods={periods}
                  quotationId={quotationId}
                />
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Credit Notes Ledger */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard className="size-4 text-emerald-500" />
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              3. Prorated Credit Notes Ledger
            </h2>
          </div>
          <CreditNotesList creditNotes={schedule.creditNotes} />
        </div>
      </div>
    </RoleGuard>
  );
}

// ─── Platform-Wide Billing Operations Command Center (/app/billing) ───────────

function BillingOperationsOverview() {
  const { data: schedules = [], isLoading: isSchedulesLoading } =
    useAllBillingSchedules();
  const { data: quotations = [], isLoading: isQuotesLoading } = useQuotations();

  const isLoading = isSchedulesLoading || isQuotesLoading;

  // Aggregate stats across all schedules
  const allInvoices = schedules
    .flatMap((s) => s.invoices)
    .filter((i) => i.status !== "VOID");

  const mockScheduleSummary = {
    id: "global",
    quotationId: "global",
    createdAt: "",
    invoices: allInvoices,
    creditNotes: schedules.flatMap((s) => s.creditNotes),
  };

  return (
    <RoleGuard
      allowedRoles={["sales_rep", "sales_manager", "finance", "admin"]}
    >
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Receipt className="size-4 text-emerald-500" />
              <span>Operations & Finance</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Hybrid Billing Operations
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Enterprise split billing management across one-time hardware
              charges and multi-tier recurring subscription series.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to={appRoutes.quotations}>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <FileSpreadsheet className="size-4" />
                View Quotations
              </Button>
            </Link>
          </div>
        </div>

        {/* Global Summary Stats */}
        <BillingStats schedule={mockScheduleSummary} isLoading={isLoading} />

        {/* Schedules Directory Table */}
        <div className="surface-card space-y-4 p-5">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Active Order Billing Schedules
              </h2>
              <p className="text-xs text-muted-foreground">
                Direct access to hybrid invoice timelines and payment
                reconciliation
              </p>
            </div>
            <span className="text-xs text-muted-foreground">
              {schedules.length} Active Schedule
              {schedules.length === 1 ? "" : "s"}
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : schedules.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No active billing schedules found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border font-medium text-muted-foreground">
                    <th className="pb-3 pl-2">Order / Customer</th>
                    <th className="pb-3">Invoices</th>
                    <th className="pb-3">Billed</th>
                    <th className="pb-3">Collected</th>
                    <th className="pb-3">Outstanding</th>
                    <th className="pb-3">Credit Notes</th>
                    <th className="pr-2 pb-3 text-right">Workspace</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {schedules.map((sch) => {
                    const quote = quotations.find(
                      (q) => q.id === sch.quotationId,
                    );
                    const nonVoid = sch.invoices.filter(
                      (i) => i.status !== "VOID",
                    );
                    const billed = nonVoid.reduce(
                      (s, i) => s + i.amountMinor,
                      0,
                    );
                    const collected = nonVoid.reduce(
                      (s, i) => s + paidMinor(i),
                      0,
                    );
                    const due = nonVoid
                      .filter((i) => i.status === "ISSUED")
                      .reduce((s, i) => s + remainingMinor(i), 0);

                    return (
                      <tr
                        key={sch.id}
                        className="hover:bg-muted/40 text-foreground transition-colors"
                      >
                        <td className="py-3 pl-2">
                          <div className="font-mono font-medium text-foreground">
                            {quote?.quotationNumber ?? sch.quotationId}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {quote?.customer?.name ?? "Enterprise Account"}
                          </div>
                        </td>
                        <td className="py-3">
                          <span className="font-mono text-muted-foreground">
                            {nonVoid.length} periods
                          </span>
                        </td>
                        <td className="py-3 font-mono font-medium">
                          $
                          {(billed / 100).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-3 font-mono font-medium text-emerald-500">
                          $
                          {(collected / 100).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-3 font-mono font-medium text-amber-500">
                          $
                          {(due / 100).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-3">
                          {sch.creditNotes.length > 0 ? (
                            <Badge tone="success" className="text-xs">
                              {sch.creditNotes.length} Note
                              {sch.creditNotes.length > 1 ? "s" : ""}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-3 pr-2 text-right">
                          <Link
                            to={appRoutes.quotationBilling(sch.quotationId)}
                          >
                            <Button size="sm" className="h-7 gap-1 text-xs">
                              <span>Open Workspace</span>
                              <ArrowRight className="size-3" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
