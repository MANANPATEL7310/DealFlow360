import type { FulfillmentSplit, Warehouse } from "@template/shared";
import { CheckCircle2, MapPin, Package, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProducts } from "@/features/products/hooks/use-products";

interface SplitsTableProps {
  splits: FulfillmentSplit[];
  warehouses: Warehouse[];
}

export function SplitsTable({ splits, warehouses }: SplitsTableProps) {
  const { data: products = [] } = useProducts();

  const productMap = new Map(products.map((p) => [p.id, p]));
  const warehouseMap = new Map(warehouses.map((w) => [w.id, w]));

  // Group splits by warehouseId
  const byWarehouse = splits.reduce<Record<string, FulfillmentSplit[]>>(
    (acc, split) => {
      const list = acc[split.warehouseId] ?? [];
      list.push(split);
      acc[split.warehouseId] = list;
      return acc;
    },
    {},
  );

  const warehouseEntries = Object.entries(byWarehouse);

  if (warehouseEntries.length === 0) {
    return (
      <Card className="p-8 text-center text-xs text-muted-foreground">
        <Truck className="mx-auto mb-2 size-8 text-muted-foreground/50" />
        <p className="font-semibold text-foreground">
          No warehouse shipment splits allocated.
        </p>
        <p className="mt-1">
          Add physical hardware products to generate an optimized fulfillment
          plan.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {warehouseEntries.map(([whId, rows], index) => {
        const wh = warehouseMap.get(whId);
        const groupFreightMinor = rows.reduce(
          (sum, r) => sum + r.shipmentCostMinor,
          0,
        );
        const groupQty = rows.reduce((sum, r) => sum + r.qty, 0);

        return (
          <Card key={whId} className="space-y-4 p-6">
            {/* Shipment Group Header */}
            <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Truck className="size-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-foreground">
                      Shipment #{index + 1}: {wh?.name ?? `Warehouse ${whId}`}
                    </h3>
                    <Badge tone="primary" className="text-xs">
                      {wh?.shippingCostWeight.toFixed(1)}x Rate
                    </Badge>
                  </div>
                  {wh?.location && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3" />
                      Origin: {wh.location}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6 text-right">
                <div>
                  <span className="text-xs text-muted-foreground">
                    Shipment Units
                  </span>
                  <p className="font-bold text-foreground">{groupQty} Units</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">
                    Group Freight Share
                  </span>
                  <p className="font-mono text-sm font-bold text-foreground">
                    ${(groupFreightMinor / 100).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Shipment Split Lines Table */}
            <div className="overflow-hidden rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="border-border bg-surface-muted/50">
                    <TableHead className="text-xs font-semibold">
                      Allocated Product
                    </TableHead>
                    <TableHead className="text-center text-xs font-semibold">
                      Category
                    </TableHead>
                    <TableHead className="text-center text-xs font-semibold">
                      Quantity
                    </TableHead>
                    <TableHead className="text-right text-xs font-semibold">
                      Freight Share
                    </TableHead>
                    <TableHead className="text-right text-xs font-semibold">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const product = productMap.get(row.productId);

                    return (
                      <TableRow key={row.id} className="border-border">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="size-4 text-muted-foreground" />
                            <div>
                              <span className="font-semibold text-foreground">
                                {product?.name ?? row.productId}
                              </span>
                              <span className="block text-xs text-muted-foreground">
                                SKU: {row.productId}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge tone="secondary" className="text-xs">
                            {product?.category ?? "HARDWARE"}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-center font-bold text-foreground">
                          {row.qty}
                        </TableCell>

                        <TableCell className="text-right font-mono text-xs font-medium text-foreground">
                          ${(row.shipmentCostMinor / 100).toFixed(2)}
                        </TableCell>

                        <TableCell className="text-right">
                          <Badge tone="success" className="gap-1 text-xs">
                            <CheckCircle2 className="size-3" />
                            Allocated
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
