import { Link } from "react-router";
import { appRoutes } from "@template/shared";
import { ArrowRight, Boxes, Building2, Calendar, Truck } from "lucide-react";
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
import { RoleGuard } from "@/features/auth/routes/role-guard";
import { useQuotations } from "@/features/quotations/hooks/use-quotations";

export function meta() {
  return [
    { title: "Warehouse Fulfillment Operations · DealFlow360" },
    {
      name: "description",
      content:
        "Manage global warehouse inventory splits, multi-depot shipments, and backorder logistics.",
    },
  ];
}

export default function FulfillmentIndexRoute() {
  const { data: quotations = [], isLoading } = useQuotations();

  // Orders that have physical lines or confirmed status
  const physicalQuotes = quotations.filter((q) =>
    q.lines.some((l) => l.product?.category === "HARDWARE" || !l.product),
  );

  return (
    <RoleGuard
      allowedRoles={["sales_rep", "sales_manager", "finance", "admin"]}
    >
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Truck className="size-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Warehouse Fulfillment Operations
              </h1>
              <Badge tone="primary">M3 Logistics</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Multi-warehouse split optimizer, freight consolidation, and
              backorder replenishment management.
            </p>
          </div>
        </div>

        {/* Directory Table */}
        <Card className="space-y-4 p-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-base font-bold text-foreground">
                Quotations with Physical Shipments
              </h2>
              <p className="text-xs text-muted-foreground">
                Select an order to inspect and optimize multi-depot shipment
                allocation
              </p>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              {physicalQuotes.length} Orders Requiring Freight
            </span>
          </div>

          <div className="overflow-hidden rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow className="border-border bg-surface-muted/50">
                  <TableHead className="text-xs font-semibold">
                    Quotation
                  </TableHead>
                  <TableHead className="text-xs font-semibold">
                    Customer Account
                  </TableHead>
                  <TableHead className="text-center text-xs font-semibold">
                    Status
                  </TableHead>
                  <TableHead className="text-center text-xs font-semibold">
                    Hardware Lines
                  </TableHead>
                  <TableHead className="text-right text-xs font-semibold">
                    Order Total
                  </TableHead>
                  <TableHead className="text-right text-xs font-semibold">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell>
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell className="text-center">
                        <Skeleton className="mx-auto h-4 w-16" />
                      </TableCell>
                      <TableCell className="text-center">
                        <Skeleton className="mx-auto h-4 w-12" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="ml-auto h-4 w-16" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="ml-auto h-8 w-24" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : physicalQuotes.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-xs text-muted-foreground"
                    >
                      No active quotations currently require physical hardware
                      fulfillment.
                    </TableCell>
                  </TableRow>
                ) : (
                  physicalQuotes.map((q) => {
                    const hwCount = q.lines.filter(
                      (l) => l.product?.category === "HARDWARE" || !l.product,
                    ).length;
                    const totalFormatted = (
                      q.grandTotalMinor / 100
                    ).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    });

                    return (
                      <TableRow key={q.id} className="border-border">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground">
                              {q.quotationNumber}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="size-3" />
                              {q.createdAt
                                ? new Date(q.createdAt).toLocaleDateString()
                                : "Recent"}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Building2 className="size-4 text-muted-foreground" />
                            <span className="font-medium text-foreground">
                              {q.customer?.name ?? "Enterprise Customer"}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge tone="primary" className="text-xs">
                            {q.status}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge tone="secondary" className="gap-1 text-xs">
                            <Boxes className="size-3" />
                            {hwCount} SKUs
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right font-mono text-sm font-bold text-foreground">
                          ${totalFormatted}
                        </TableCell>

                        <TableCell className="text-right">
                          <Link to={appRoutes.quotationFulfillment(q.id)}>
                            <Button
                              size="sm"
                              variant="primary"
                              className="h-8 gap-1 rounded-lg text-xs"
                            >
                              Inspect Plan
                              <ArrowRight className="size-3" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </RoleGuard>
  );
}
