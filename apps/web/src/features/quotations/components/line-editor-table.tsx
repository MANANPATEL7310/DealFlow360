import type { CustomerTier, QuotationLine } from "@template/shared";
import {
  AlertTriangle,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface LineEditorTableProps {
  lines: QuotationLine[];
  customerTier: CustomerTier;
  onUpdateLine: (
    lineId: string,
    patch: { qty?: number; discountPct?: number },
  ) => void;
  onRemoveLine: (lineId: string) => void;
  isUpdating?: boolean;
}

// Category and tier ceilings for fast visual indicators
const CATEGORY_CAPS: Record<string, number> = {
  HARDWARE: 15.0,
  SERVICES: 10.0,
  SUBSCRIPTIONS: 12.0,
};

const TIER_CAPS: Record<CustomerTier, number> = {
  GOLD: 15.0,
  SILVER: 10.0,
  BRONZE: 5.0,
};

export function LineEditorTable({
  lines,
  customerTier,
  onUpdateLine,
  onRemoveLine,
}: LineEditorTableProps) {
  const tierCap = TIER_CAPS[customerTier] ?? 10.0;

  if (lines.length === 0) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-border p-6 text-center text-muted-foreground">
        <Package className="mb-2 size-8 text-muted-foreground/40" />
        <p className="text-sm font-semibold text-foreground">
          No line items added yet
        </p>
        <p className="text-xs text-muted-foreground">
          Click "Add Product Line" above to select products from the catalog.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product / Item</TableHead>
          <TableHead>Unit Price</TableHead>
          <TableHead>Quantity</TableHead>
          <TableHead>Discount %</TableHead>
          <TableHead>Policy Compliance</TableHead>
          <TableHead>Net Total</TableHead>
          <TableHead className="text-right">Remove</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lines.map((line) => {
          const cat = line.product?.category ?? "HARDWARE";
          const catCap = CATEGORY_CAPS[cat] ?? 15.0;
          const applicableCap = Math.min(tierCap, catCap);
          const excess = Math.max(0, line.discountPct - applicableCap);
          const isCompliant = excess === 0;

          const gross = line.qty * line.unitPriceMinor;
          const discount = Math.round(gross * (line.discountPct / 100));
          const net = gross - discount;

          return (
            <TableRow key={line.id}>
              {/* Product info */}
              <TableCell className="font-medium">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-foreground">
                      {line.product?.name ?? "Custom Product"}
                    </span>
                    <Badge
                      tone={
                        cat === "HARDWARE"
                          ? "primary"
                          : cat === "SERVICES"
                            ? "secondary"
                            : "warning"
                      }
                    >
                      {cat}
                    </Badge>
                  </div>
                  {line.variant && (
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      Variant: {line.variant.attribute} — {line.variant.value}
                    </div>
                  )}
                  {line.lineType === "RECURRING" && (
                    <span className="inline-block text-xs font-semibold text-secondary-dark">
                      Recurring Subscription
                    </span>
                  )}
                </div>
              </TableCell>

              {/* Unit Price */}
              <TableCell>
                <div>
                  <span className="font-mono text-xs font-semibold text-foreground">
                    ${(line.unitPriceMinor / 100).toFixed(2)}
                  </span>
                  <div className="text-xs text-muted-foreground">
                    Cost: ${(line.unitCostMinor / 100).toFixed(2)}
                  </div>
                </div>
              </TableCell>

              {/* Quantity Stepper */}
              <TableCell>
                <div className="flex items-center gap-1">
                  <button
                    className="flex size-7 items-center justify-center rounded border border-border bg-surface text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                    disabled={line.qty <= 1}
                    type="button"
                    onClick={() =>
                      onUpdateLine(line.id, {
                        qty: Math.max(1, line.qty - 1),
                      })
                    }
                  >
                    <Minus className="size-3" />
                  </button>
                  <Input
                    className="h-7 w-12 text-center font-mono text-xs"
                    min={1}
                    type="number"
                    value={line.qty}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val >= 1) {
                        onUpdateLine(line.id, { qty: val });
                      }
                    }}
                  />
                  <button
                    className="flex size-7 items-center justify-center rounded border border-border bg-surface text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                    type="button"
                    onClick={() =>
                      onUpdateLine(line.id, { qty: line.qty + 1 })
                    }
                  >
                    <Plus className="size-3" />
                  </button>
                </div>
              </TableCell>

              {/* Discount Input */}
              <TableCell>
                <div className="relative w-20">
                  <Input
                    className="h-8 w-full pr-5 text-right font-mono text-xs"
                    max={100}
                    min={0}
                    step={0.5}
                    type="number"
                    value={line.discountPct}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val >= 0 && val <= 100) {
                        onUpdateLine(line.id, { discountPct: val });
                      }
                    }}
                  />
                  <span className="pointer-events-none absolute top-2 right-2 text-xs font-semibold text-muted-foreground">
                    %
                  </span>
                </div>
              </TableCell>

              {/* Policy Compliance */}
              <TableCell>
                {isCompliant ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-success-dark">
                    <ShieldCheck className="size-3.5" /> Cap {applicableCap}% (Safe)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-danger-dark">
                    <AlertTriangle className="size-3.5" /> Cap {applicableCap}% (+{excess.toFixed(1)}% Excess)
                  </span>
                )}
              </TableCell>

              {/* Net Total */}
              <TableCell>
                <div className="font-mono text-xs font-bold text-foreground">
                  ${(net / 100).toFixed(2)}
                </div>
                {discount > 0 && (
                  <div className="font-mono text-xs text-danger-dark">
                    -${(discount / 100).toFixed(2)}
                  </div>
                )}
              </TableCell>

              {/* Remove Action */}
              <TableCell className="text-right">
                <Button
                  className="size-8 p-0 text-danger-dark hover:bg-danger-light/10"
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemoveLine(line.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
