import { useState } from "react";
import { Link, useParams } from "react-router";
import { appRoutes } from "@template/shared";
import {
  ArrowLeft,
  Building2,
  Edit3,
  FileSpreadsheet,
  Package,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { RoleGuard } from "@/features/auth/routes/role-guard";
import { BackorderList } from "@/features/fulfillment/components/backorder-list";
import { FulfillmentStats } from "@/features/fulfillment/components/fulfillment-stats";
import { OverrideEditor } from "@/features/fulfillment/components/override-editor";
import { SplitsTable } from "@/features/fulfillment/components/splits-table";
import { AiFulfillmentPlannerCard } from "@/features/fulfillment/components/ai-fulfillment-planner-card";
import {
  useAcceptPlan,
  useConsolidateBackorder,
  useFulfillmentPlan,
  useOverridePlan,
  useWarehouses,
} from "@/features/fulfillment/hooks/use-fulfillment";
import { useQuotation } from "@/features/quotations/hooks/use-quotations";

export function FulfillmentPage() {
  const { id } = useParams<{ id: string }>();
  const quotationId = id ?? "";

  const { data: quote, isLoading: isQuoteLoading } = useQuotation(quotationId);
  const { data: plan, isLoading: isPlanLoading } =
    useFulfillmentPlan(quotationId);
  const { data: warehouses = [], isLoading: isWhLoading } = useWarehouses();

  const acceptMutation = useAcceptPlan(quotationId);
  const overrideMutation = useOverridePlan(quotationId);
  const consolidateMutation = useConsolidateBackorder(quotationId);

  const [isEditing, setIsEditing] = useState(false);

  const isLoading = isQuoteLoading || isPlanLoading || isWhLoading;

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
          <Skeleton className="h-80 w-full" />
        </div>
      </RoleGuard>
    );
  }

  if (!plan) {
    return (
      <RoleGuard
        allowedRoles={["sales_rep", "sales_manager", "finance", "admin"]}
      >
        <div className="flex min-h-80 flex-col items-center justify-center space-y-3 text-center">
          <FileSpreadsheet className="size-10 text-muted-foreground/50" />
          <h2 className="text-lg font-bold text-foreground">
            No Fulfillment Plan Found
          </h2>
          <p className="text-xs text-muted-foreground">
            This quotation has not initialized a warehouse allocation plan.
          </p>
          <Link to={appRoutes.quotationBuilder(quotationId)}>
            <Button size="sm" variant="outline">
              <ArrowLeft className="mr-1.5 size-4" /> Return to Quotation
              Builder
            </Button>
          </Link>
        </div>
      </RoleGuard>
    );
  }

  const isAccepted = plan.status === "ACCEPTED";

  return (
    <RoleGuard
      allowedRoles={["sales_rep", "sales_manager", "finance", "admin"]}
    >
      <div className="space-y-6 pb-12">
        {/* Navigation & Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to={appRoutes.quotationBuilder(quotationId)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to Quotation {quote?.quotationNumber ?? ""}
          </Link>

          <Badge
            tone={
              isAccepted
                ? "success"
                : plan.status === "OVERRIDDEN"
                  ? "warning"
                  : "primary"
            }
            className="px-3 py-1 font-semibold"
          >
            {isAccepted
              ? "Plan Committed (Read-Only)"
              : plan.status === "OVERRIDDEN"
                ? "Manually Reallocated"
                : "Optimizer Suggested"}
          </Badge>
        </div>

        {/* Top Header Card */}
        <div className="surface-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Truck className="size-5" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Fulfillment & Warehouse Allocation
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-4 pl-12 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {quote?.quotationNumber ?? quotationId}
                </span>
                {quote?.customer && (
                  <div className="flex items-center gap-1">
                    <Building2 className="size-3.5" />
                    <span>{quote.customer.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Package className="size-3.5" />
                  <span>{quote?.lines.length ?? 0} Commercial Lines</span>
                </div>
              </div>
            </div>

            {/* Header Action Buttons */}
            {!isAccepted && (
              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(!isEditing)}
                  className="h-9 gap-1.5 rounded-xl text-xs"
                >
                  <Edit3 className="size-3.5" />
                  {isEditing ? "View Current Plan" : "Manual Split Override"}
                </Button>

                <Button
                  size="sm"
                  variant="primary"
                  disabled={acceptMutation.isPending}
                  onClick={() => acceptMutation.mutate()}
                  className="h-9 gap-2 rounded-xl text-xs font-semibold shadow-xs"
                >
                  {acceptMutation.isPending ? (
                    <Spinner className="size-3.5" />
                  ) : (
                    <ShieldCheck className="size-4" />
                  )}
                  Accept Suggestion & Commit Stock
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Headline KPI Ribbon */}
        <FulfillmentStats isLoading={isLoading} plan={plan} />

        {/* AI Multi-Warehouse Planner (Agent 3) */}
        <AiFulfillmentPlannerCard
          quotationId={quotationId}
          isPlanAccepted={isAccepted}
          onApplyPlan={async (splits) => {
            await overrideMutation.mutateAsync(splits);
          }}
          isApplying={overrideMutation.isPending}
        />

        {/* Manual Override Editor or Shipment Group Splits */}
        {isEditing && !isAccepted ? (
          <OverrideEditor
            isSaving={overrideMutation.isPending}
            onCancel={() => setIsEditing(false)}
            onSave={async (splits) => {
              await overrideMutation.mutateAsync(splits);
              setIsEditing(false);
            }}
            plan={plan}
            warehouses={warehouses}
          />
        ) : (
          <SplitsTable splits={plan.splits} warehouses={warehouses} />
        )}

        {/* Backorder Management Section */}
        <BackorderList
          backorders={plan.backorders}
          isConsolidating={consolidateMutation.isPending}
          onConsolidate={(backorderId) =>
            consolidateMutation.mutate(backorderId)
          }
        />
      </div>
    </RoleGuard>
  );
}
