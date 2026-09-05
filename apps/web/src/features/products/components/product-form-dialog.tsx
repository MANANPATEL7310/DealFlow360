import { useState } from "react";
import {
  type CreateProductInput,
  type Product,
  type ProductCategory,
  productCategories,
} from "@template/shared";
import { DollarSign, Percent, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";

interface ProductFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateProductInput) => void;
  initialProduct?: Product | null;
  isPending?: boolean;
}

function ProductFormContent({
  onClose,
  onSubmit,
  initialProduct,
  isPending,
}: Omit<ProductFormDialogProps, "isOpen">) {
  const [name, setName] = useState(initialProduct?.name ?? "");
  const [category, setCategory] = useState<ProductCategory>(
    initialProduct?.category ?? "HARDWARE",
  );
  const [unit, setUnit] = useState(initialProduct?.unit ?? "unit");
  const [basePriceDollars, setBasePriceDollars] = useState(
    initialProduct ? (initialProduct.basePrice / 100).toFixed(2) : "",
  );
  const [unitCostDollars, setUnitCostDollars] = useState(
    initialProduct ? (initialProduct.unitCost / 100).toFixed(2) : "",
  );
  const [description, setDescription] = useState(
    initialProduct?.description ?? "",
  );
  const [isPromoted, setIsPromoted] = useState(
    initialProduct?.isPromoted ?? false,
  );

  const priceNum = parseFloat(basePriceDollars) || 0;
  const costNum = parseFloat(unitCostDollars) || 0;
  const marginPct =
    priceNum > 0
      ? Math.round(((priceNum - costNum) / priceNum) * 1000) / 10
      : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || priceNum <= 0 || costNum <= 0) return;

    onSubmit({
      name: name.trim(),
      category,
      unit: unit.trim() || "unit",
      basePrice: Math.round(priceNum * 100),
      unitCost: Math.round(costNum * 100),
      taxRatePct: 0,
      description: description.trim() || undefined,
      isPromoted,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <Card className="bg-card relative w-full max-w-lg space-y-6 border-border p-6 shadow-2xl">
        <div className="flex items-start justify-between border-b border-border/60 pb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {initialProduct ? "Edit Catalog Item" : "Create New Product"}
            </h2>
            <p className="text-xs text-muted-foreground">
              Define pricing parameters and cost baselines for quotation
              governance.
            </p>
          </div>
          <button
            className="hover:bg-muted rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground"
            type="button"
            onClick={onClose}
          >
            <X className="size-5" />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label
              className="text-xs font-semibold text-foreground"
              htmlFor="prod-name"
            >
              Product Name
            </label>
            <Input
              id="prod-name"
              placeholder="e.g. ApexEdge 2U Enterprise Server"
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Category
              </label>
              <select
                className="bg-card w-full rounded-md border border-border px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
              >
                {productCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                className="text-xs font-semibold text-foreground"
                htmlFor="prod-unit"
              >
                Unit of Measure
              </label>
              <Input
                id="prod-unit"
                placeholder="unit, hour, licence/mo"
                required
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label
                className="text-xs font-semibold text-foreground"
                htmlFor="prod-cost"
              >
                Unit Cost (COGS $)
              </label>
              <div className="relative">
                <DollarSign className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-8"
                  id="prod-cost"
                  min="0.01"
                  placeholder="2925.00"
                  required
                  step="0.01"
                  type="number"
                  value={unitCostDollars}
                  onChange={(e) => setUnitCostDollars(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                className="text-xs font-semibold text-foreground"
                htmlFor="prod-price"
              >
                Base List Price ($)
              </label>
              <div className="relative">
                <DollarSign className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-8"
                  id="prod-price"
                  min="0.01"
                  placeholder="4500.00"
                  required
                  step="0.01"
                  type="number"
                  value={basePriceDollars}
                  onChange={(e) => setBasePriceDollars(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Live Calculated Margin Preview */}
          <div className="bg-muted/40 flex items-center justify-between rounded-lg border border-border/80 p-3 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Percent className="size-4 text-primary" />
              <span>Standard Gross Margin:</span>
            </div>
            <span
              className={cn(
                "font-bold",
                marginPct >= 30
                  ? "text-emerald-500"
                  : marginPct >= 15
                    ? "text-amber-500"
                    : "text-rose-500",
              )}
            >
              {marginPct}%
            </span>
          </div>

          <div className="space-y-1.5">
            <label
              className="text-xs font-semibold text-foreground"
              htmlFor="prod-desc"
            >
              Product Description
            </label>
            <textarea
              className="bg-card w-full rounded-md border border-border p-2.5 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
              id="prod-desc"
              placeholder="Technical specifications, SLA terms, or hardware details..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <label className="flex items-center gap-2.5 text-xs text-foreground">
            <input
              checked={isPromoted}
              className="size-4 rounded border border-border accent-primary"
              type="checkbox"
              onChange={(e) => setIsPromoted(e.target.checked)}
            />
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="size-3.5 text-amber-500" />
              Promoted Catalog Item (suggested in real-time upsells)
            </span>
          </label>

          <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-4">
            <Button
              disabled={isPending}
              variant="outline"
              type="button"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button disabled={isPending} type="submit">
              {isPending
                ? "Saving..."
                : initialProduct
                  ? "Update Product"
                  : "Create Product"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export function ProductFormDialog(props: ProductFormDialogProps) {
  if (!props.isOpen) return null;

  return (
    <ProductFormContent
      key={props.initialProduct?.id ?? "new"}
      initialProduct={props.initialProduct}
      isPending={props.isPending}
      onClose={props.onClose}
      onSubmit={props.onSubmit}
    />
  );
}
