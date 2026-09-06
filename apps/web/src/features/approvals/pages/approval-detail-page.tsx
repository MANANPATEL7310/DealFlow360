import { useState } from "react";
import { Link, useParams } from "react-router";
import { appRoutes } from "@template/shared";
import {
  ArrowLeft,
  Building2,
  Calendar,
  FileSpreadsheet,
  Package,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApprovalStepsStepper } from "@/features/approvals/components/approval-steps-stepper";
import { AuditTimeline } from "@/features/approvals/components/audit-timeline";
import { DecisionModal } from "@/features/approvals/components/decision-modal";
import { RiskBreakdownCard } from "@/features/approvals/components/risk-breakdown-card";
import { AiDiscountReviewCard } from "@/features/approvals/components/ai-discount-review-card";
import {
  useApprovalDetails,
  useSubmitApprovalDecision,
} from "@/features/approvals/hooks/use-approvals";
import { RoleGuard } from "@/features/auth/routes/role-guard";

export function ApprovalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [isDecisionOpen, setIsDecisionOpen] = useState(false);

  const { data: details, isLoading } = useApprovalDetails(id);
  const decisionMutation = useSubmitApprovalDecision(id ?? "");

  if (isLoading) {
    return (
      <RoleGuard allowedRoles={["sales_manager", "finance", "admin"]}>
        <div className="space-y-6 pb-12">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-28 w-full" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <Skeleton className="h-96 lg:col-span-7" />
            <Skeleton className="h-96 lg:col-span-5" />
          </div>
        </div>
      </RoleGuard>
    );
  }

  if (!details || !details.quotation) {
    return (
      <RoleGuard allowedRoles={["sales_manager", "finance", "admin"]}>
        <div className="flex min-h-80 flex-col items-center justify-center space-y-3 text-center">
          <FileSpreadsheet className="size-10 text-muted-foreground/50" />
          <h2 className="text-lg font-bold text-foreground">
            Quotation Not Found
          </h2>
          <p className="text-xs text-muted-foreground">
            The requested quotation ID does not exist or has been removed.
          </p>
          <Link to={appRoutes.approvals}>
            <Button size="sm" variant="outline">
              <ArrowLeft className="mr-1.5 size-4" /> Return to Approval Queue
            </Button>
          </Link>
        </div>
      </RoleGuard>
    );
  }

  const { quotation, risk, currentStep, canReview } = details;
  const isPendingApproval = quotation.status === "PENDING_APPROVAL";

  const totalDollars = (quotation.grandTotalMinor / 100).toLocaleString(
    undefined,
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  );

  const createdFormatted = quotation.createdAt
    ? new Date(quotation.createdAt).toLocaleDateString()
    : "Recent";

  return (
    <RoleGuard allowedRoles={["sales_manager", "finance", "admin"]}>
      <div className="space-y-6 pb-12">
        {/* Navigation & Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to={appRoutes.approvals}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to Approvals Queue
          </Link>

          <Badge
            tone={
              isPendingApproval
                ? "warning"
                : quotation.status === "APPROVED"
                  ? "success"
                  : quotation.status === "REJECTED"
                    ? "danger"
                    : "neutral"
            }
            className="px-3 py-1 font-semibold"
          >
            Status: {quotation.status}
          </Badge>
        </div>

        {/* Deal Header Overview */}
        <div className="surface-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {quotation.quotationNumber}
                </h1>
                <Badge tone="primary" className="text-xs">
                  Review
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <Building2 className="size-4 text-muted-foreground" />
                  {quotation.customer?.name ?? "Customer"}
                </div>
                <div className="flex items-center gap-1">
                  <span>Tier:</span>
                  <Badge tone="secondary" className="text-xs">
                    {quotation.customer?.tier ?? "Standard"}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-muted-foreground" />
                  {createdFormatted}
                </div>
              </div>
            </div>

            {/* Financial Highlights */}
            <div className="flex flex-wrap items-center gap-6 border-t border-border pt-4 lg:border-t-0 lg:pt-0">
              <div className="text-left lg:text-right">
                <span className="text-xs text-muted-foreground">
                  Grand Total
                </span>
                <p className="text-xl font-black text-foreground">
                  ${totalDollars}
                </p>
              </div>

              <div className="text-left lg:text-right">
                <span className="text-xs text-muted-foreground">
                  Gross Margin
                </span>
                <p
                  className={`text-xl font-black ${
                    quotation.marginPct >= 30
                      ? "text-success"
                      : quotation.marginPct >= 20
                        ? "text-warning"
                        : "text-danger"
                  }`}
                >
                  {quotation.marginPct.toFixed(1)}%
                </p>
              </div>

              <div className="text-left lg:text-right">
                <span className="text-xs text-muted-foreground">
                  Risk score
                </span>
                <p
                  className={`text-xl font-black ${
                    (quotation.blendedRiskScore ?? 0) >= 70
                      ? "text-danger"
                      : (quotation.blendedRiskScore ?? 0) >= 40
                        ? "text-warning"
                        : "text-success"
                  }`}
                >
                  {quotation.blendedRiskScore ?? 0}/100
                </p>
              </div>
            </div>
          </div>

          {/* Action Callout Ribbon */}
          {isPendingApproval && (
            <div className="mt-6 flex flex-col gap-4 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ShieldAlert className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    {canReview
                      ? `Action Required: ${currentStep?.level === "SALES_MANAGER" ? "Sales Manager Tier 1 Review" : "Finance Lead Tier 2 Review"}`
                      : `Awaiting Review: ${currentStep?.level === "SALES_MANAGER" ? "Sales Manager Tier 1" : "Finance Lead Tier 2"}`}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {canReview
                      ? "You have authorization privileges to evaluate discount concessions and advance this quotation."
                      : "This deal is currently assigned to another governance review tier."}
                  </p>
                </div>
              </div>

              {canReview && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setIsDecisionOpen(true)}
                  className="h-10 shrink-0 gap-2 px-5 font-semibold shadow-md"
                >
                  <ShieldCheck className="size-4" />
                  Submit Review Decision
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Commercial Details & Risk Breakdown */}
          <div className="space-y-6 lg:col-span-7">
            {/* Commercial Lines Summary */}
            <Card className="space-y-4 p-6">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Package className="size-4 text-primary" />
                  <h3 className="text-base font-bold text-foreground">
                    Line items
                  </h3>
                </div>
                <span className="text-xs text-muted-foreground">
                  {quotation.lines.length} Item
                  {quotation.lines.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="overflow-hidden rounded-xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border bg-surface-muted/50">
                      <TableHead className="text-xs font-semibold">
                        Product
                      </TableHead>
                      <TableHead className="text-center text-xs font-semibold">
                        Qty
                      </TableHead>
                      <TableHead className="text-right text-xs font-semibold">
                        List Price
                      </TableHead>
                      <TableHead className="text-center text-xs font-semibold">
                        Discount
                      </TableHead>
                      <TableHead className="text-right text-xs font-semibold">
                        Total
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotation.lines.map((line) => {
                      const listMinor = line.unitPriceMinor * line.qty;
                      const discountedMinor =
                        listMinor * (1 - line.discountPct / 100);

                      return (
                        <TableRow key={line.id} className="border-border">
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-foreground">
                                {line.product?.name ?? "Custom Line"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {line.lineType}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {line.qty}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            ${(line.unitPriceMinor / 100).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={`font-semibold ${
                                line.discountPct > 15
                                  ? "text-danger"
                                  : line.discountPct > 5
                                    ? "text-warning"
                                    : "text-foreground"
                              }`}
                            >
                              {line.discountPct.toFixed(1)}%
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-bold text-foreground">
                            ${(discountedMinor / 100).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {/* AI Discount Approval Review Card */}
            <AiDiscountReviewCard quotation={quotation} risk={risk ?? null} />

            {/* Risk Breakdown Card */}
            <RiskBreakdownCard quotation={quotation} risk={risk ?? null} />
          </div>

          {/* Right Column: Multi-Tier Stepper & Audit Log */}
          <div className="space-y-6 lg:col-span-5">
            {/* Sequential Steps Stepper */}
            <ApprovalStepsStepper
              currentStep={currentStep}
              quotation={quotation}
            />

            {/* Audit History Timeline */}
            <AuditTimeline events={quotation.statusEvents} />
          </div>
        </div>

        {/* Decision Modal */}
        <DecisionModal
          currentStep={currentStep}
          isOpen={isDecisionOpen}
          isPending={decisionMutation.isPending}
          onClose={() => setIsDecisionOpen(false)}
          onSubmit={async (input) => {
            await decisionMutation.mutateAsync(input);
          }}
          quotation={quotation}
        />
      </div>
    </RoleGuard>
  );
}
