import type { Backorder } from "@template/shared";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Package,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProducts } from "@/features/products/hooks/use-products";

interface BackorderListProps {
  backorders: Backorder[];
  onConsolidate: (backorderId: string) => void;
  isConsolidating: boolean;
}

export function BackorderList({
  backorders,
  onConsolidate,
  isConsolidating,
}: BackorderListProps) {
  const { data: products = [] } = useProducts();
  const productMap = new Map(products.map((p) => [p.id, p]));

  const openBackorders = backorders.filter((b) => b.qtyOutstanding > 0);

  if (openBackorders.length === 0) {
    return (
      <Card className="flex items-center gap-3 p-5">
        <div className="flex size-10 items-center justify-center rounded-xl bg-success/10 text-success">
          <CheckCircle2 className="size-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-foreground">
            Zero Outstanding Backorders
          </h4>
          <p className="text-xs text-muted-foreground">
            All requested line quantities are completely covered by available regional warehouse stock.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="space-y-4 border-warning/30 p-6">
      <div className="flex flex-col gap-2 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-warning/10 text-warning">
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground">
                Outstanding Backorders & Replenishment
              </h3>
              <Badge tone="warning" className="text-xs font-semibold">
                {openBackorders.length} Shortage Items
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              These items exceed current available warehouse stock and require consolidation or replenishment
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-surface-muted/50">
              <TableHead className="text-xs font-semibold">Shortage Product</TableHead>
              <TableHead className="text-center text-xs font-semibold">Outstanding Qty</TableHead>
              <TableHead className="text-center text-xs font-semibold">Status</TableHead>
              <TableHead className="text-right text-xs font-semibold">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {openBackorders.map((b) => {
              const product = productMap.get(b.productId);

              return (
                <TableRow key={b.id} className="border-border">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Package className="size-4 text-warning" />
                      <div>
                        <span className="font-semibold text-foreground">
                          {product?.name ?? b.productId}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          SKU: {b.productId}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-center font-bold text-danger">
                    {b.qtyOutstanding} Units
                  </TableCell>

                  <TableCell className="text-center">
                    <Badge tone="warning" className="gap-1 text-xs">
                      <Clock className="size-3" />
                      Awaiting Restock
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={isConsolidating}
                      onClick={() => onConsolidate(b.id)}
                      className="h-8 gap-1.5 rounded-lg text-xs font-medium"
                    >
                      {isConsolidating ? (
                        <Spinner className="size-3" />
                      ) : (
                        <ArrowRight className="size-3" />
                      )}
                      Consolidate Remaining
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
