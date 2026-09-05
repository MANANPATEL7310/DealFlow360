import { useState } from "react";
import type {
  FulfillmentPlan,
  ManualSplitInput,
  Warehouse,
} from "@template/shared";
import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  Plus,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

interface OverrideEditorProps {
  plan: FulfillmentPlan;
  warehouses: Warehouse[];
  isSaving: boolean;
  onSave: (splits: ManualSplitInput[]) => Promise<void> | void;
  onCancel: () => void;
}

export function OverrideEditor({
  plan,
  warehouses,
  isSaving,
  onSave,
  onCancel,
}: OverrideEditorProps) {
  const { data: products = [] } = useProducts();
  const productMap = new Map(products.map((p) => [p.id, p]));

  // Initialize editable rows from current plan splits
  const [rows, setRows] = useState<ManualSplitInput[]>(
    plan.splits.map((s) => ({
      warehouseId: s.warehouseId,
      productId: s.productId,
      qty: s.qty,
    })),
  );

  // Compute total required demand per product from original plan
  const demandMap = new Map<string, number>();
  for (const s of plan.splits) {
    demandMap.set(s.productId, (demandMap.get(s.productId) ?? 0) + s.qty);
  }
  for (const b of plan.backorders) {
    demandMap.set(
      b.productId,
      (demandMap.get(b.productId) ?? 0) + b.qtyOutstanding,
    );
  }

  // Current assigned per product
  const assignedMap = new Map<string, number>();
  for (const r of rows) {
    assignedMap.set(r.productId, (assignedMap.get(r.productId) ?? 0) + r.qty);
  }

  // Check if every product demand is satisfied
  const isCoverageComplete = [...demandMap.entries()].every(
    ([pid, required]) => (assignedMap.get(pid) ?? 0) >= required,
  );

  const handleRowChange = (
    index: number,
    field: keyof ManualSplitInput,
    value: string | number,
  ) => {
    setRows((prev) => {
      const next = [...prev];
      const target = next[index];
      if (target) {
        next[index] = { ...target, [field]: value };
      }
      return next;
    });
  };

  const handleAddRow = () => {
    const firstWh = warehouses[0]?.id ?? "wh-01";
    const firstProduct = [...demandMap.keys()][0] ?? products[0]?.id ?? "prd-hw-01";
    setRows((prev) => [
      ...prev,
      { warehouseId: firstWh, productId: firstProduct, qty: 1 },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rows.length === 0) return;
    await onSave(rows);
  };

  return (
    <Card className="space-y-5 border-primary/40 bg-surface-muted/20 p-6 shadow-md">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Edit3 className="size-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              Manual Split Allocation Override
            </h3>
            <p className="text-xs text-muted-foreground">
              Customize shipment origin warehouses and unit allocations
            </p>
          </div>
        </div>

        <Badge
          tone={isCoverageComplete ? "success" : "warning"}
          className="gap-1 text-xs font-semibold"
        >
          {isCoverageComplete ? (
            <CheckCircle2 className="size-3" />
          ) : (
            <AlertCircle className="size-3" />
          )}
          {isCoverageComplete
            ? "Full Demand Allocated"
            : "Demand Incompletely Covered"}
        </Badge>
      </div>

      {/* Editable Table */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-card overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="border-border bg-surface-muted/50">
                <TableHead className="text-xs font-semibold">Warehouse Origin</TableHead>
                <TableHead className="text-xs font-semibold">Product SKU</TableHead>
                <TableHead className="w-32 text-center text-xs font-semibold">Quantity</TableHead>
                <TableHead className="w-16 text-right text-xs font-semibold">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, idx) => (
                <TableRow key={`override-row-${idx}`} className="border-border">
                  <TableCell>
                    <select
                      value={row.warehouseId}
                      onChange={(e) =>
                        handleRowChange(idx, "warehouseId", e.target.value)
                      }
                      className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:border-primary focus:outline-hidden"
                    >
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.location})
                        </option>
                      ))}
                    </select>
                  </TableCell>

                  <TableCell>
                    <select
                      value={row.productId}
                      onChange={(e) =>
                        handleRowChange(idx, "productId", e.target.value)
                      }
                      className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:border-primary focus:outline-hidden"
                    >
                      {[...demandMap.keys()].map((pid) => (
                        <option key={pid} value={pid}>
                          {productMap.get(pid)?.name ?? pid}
                        </option>
                      ))}
                    </select>
                  </TableCell>

                  <TableCell className="text-center">
                    <Input
                      type="number"
                      min={1}
                      value={row.qty}
                      onChange={(e) =>
                        handleRowChange(
                          idx,
                          "qty",
                          Math.max(1, parseInt(e.target.value, 10) || 1),
                        )
                      }
                      className="h-9 text-center text-xs font-bold"
                    />
                  </TableCell>

                  <TableCell className="text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={rows.length <= 1}
                      onClick={() => handleRemoveRow(idx)}
                      className="size-8 p-0 text-muted-foreground hover:text-danger"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleAddRow}
            className="h-8 gap-1.5 rounded-lg text-xs"
          >
            <Plus className="size-3.5" />
            Add Split Line
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isSaving}
              onClick={onCancel}
              className="h-9 rounded-lg text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              variant="primary"
              disabled={isSaving || rows.length === 0}
              className="h-9 gap-1.5 rounded-lg text-xs font-semibold shadow-xs"
            >
              {isSaving && <Spinner className="size-3.5" />}
              Save Allocation Plan
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
