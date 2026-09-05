import { useState } from "react";
import type { AddLineInput, LineType, Product } from "@template/shared";
import {
  Briefcase,
  Cpu,
  Package,
  Plus,
  Repeat,
  Search,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProducts } from "@/features/products/hooks/use-products";

interface ProductPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLine: (input: AddLineInput) => void;
  isAdding?: boolean;
}

export function ProductPickerModal({
  isOpen,
  onClose,
  onAddLine,
  isAdding,
}: ProductPickerModalProps) {
  const { data: products = [], isLoading } = useProducts();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Selected item configuration
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [qty, setQty] = useState<number>(1);
  const [discountPct, setDiscountPct] = useState<number>(0);
  const [lineType, setLineType] = useState<LineType>("ONE_TIME");

  if (!isOpen) return null;

  const selectedProduct: Product | undefined = products.find(
    (p) => p.id === selectedProductId,
  );

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== "ALL" && p.category !== selectedCategory) {
      return false;
    }
    if (search.trim().length > 0) {
      const q = search.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSelectProduct = (product: Product) => {
    setSelectedProductId(product.id);
    setSelectedVariantId(product.variants[0]?.id ?? "");
    if (product.category === "SUBSCRIPTIONS") {
      setLineType("RECURRING");
    } else {
      setLineType("ONE_TIME");
    }
  };

  const handleAdd = () => {
    if (!selectedProductId) return;

    onAddLine({
      productId: selectedProductId,
      variantId: selectedVariantId || undefined,
      qty,
      discountPct,
      lineType,
    });
    onClose();
  };

  const selectedVariant = selectedProduct?.variants.find(
    (v) => v.id === selectedVariantId,
  );
  const computedUnitCents =
    (selectedProduct?.basePrice ?? 0) + (selectedVariant?.extraPrice ?? 0);
  const formattedUnitDollars = (computedUnitCents / 100).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="surface-card flex max-h-160 w-full max-w-3xl flex-col rounded-xl border border-border p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Package className="size-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Add Catalog Product to Quotation
              </h3>
              <p className="text-xs text-muted-foreground">
                Browse catalog, select variant specifications, and configure line
                pricing.
              </p>
            </div>
          </div>
          <button
            className="rounded p-1 text-muted-foreground hover:bg-surface-muted hover:text-foreground"
            type="button"
            onClick={onClose}
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content Split: Left Catalog List, Right Line Config */}
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-hidden md:grid-cols-12">
          {/* Left: Search & Products List (7 cols) */}
          <div className="flex flex-col space-y-3 overflow-hidden md:col-span-7">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
                <Input
                  className="h-9 w-full pr-3 pl-9 text-xs"
                  placeholder="Filter catalog products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-1">
                {(["ALL", "HARDWARE", "SERVICES", "SUBSCRIPTIONS"] as const).map(
                  (cat) => (
                    <button
                      key={cat}
                      className={`rounded-lg px-2 py-1 text-xs font-semibold transition-colors ${
                        selectedCategory === cat
                          ? "bg-primary text-surface"
                          : "bg-surface-muted/50 text-muted-foreground hover:bg-surface-muted"
                      }`}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat === "ALL" ? "All" : cat.slice(0, 4)}
                    </button>
                  ),
                )}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 space-y-2 overflow-y-auto pr-1">
              {isLoading ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  Loading catalog products...
                </div>
              ) : filteredProducts.map((p) => {
                const isSelected = p.id === selectedProductId;
                return (
                  <div
                    key={p.id}
                    className={`cursor-pointer rounded-lg border p-3 transition-all ${
                      isSelected
                        ? "border-primary bg-primary-light/10 shadow-xs"
                        : "border-border bg-surface hover:bg-surface-muted/50"
                    }`}
                    onClick={() => handleSelectProduct(p)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-foreground">
                            {p.name}
                          </span>
                          <Badge
                            className="text-xs"
                            tone={
                              p.category === "HARDWARE"
                                ? "primary"
                                : p.category === "SERVICES"
                                  ? "secondary"
                                  : "warning"
                            }
                          >
                            {p.category}
                          </Badge>
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                          {p.description}
                        </p>
                      </div>
                      <span className="font-mono text-xs font-bold text-foreground">
                        ${(p.basePrice / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Selected Product Line Configuration (5 cols) */}
          <div className="space-y-4 rounded-lg border border-border bg-surface-muted/30 p-4 md:col-span-5">
            <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Line Configuration
            </h4>

            {selectedProduct ? (
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-muted-foreground">Selected:</div>
                  <div className="text-sm font-bold text-foreground">
                    {selectedProduct.name}
                  </div>
                  <div className="font-mono text-xs font-semibold text-primary">
                    ${formattedUnitDollars} / {selectedProduct.unit}
                  </div>
                </div>

                {/* Variants Selector */}
                {selectedProduct.variants.length > 0 && (
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-foreground">
                      Product Variant
                    </label>
                    <select
                      className="input-shell h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-xs text-foreground focus-visible:outline-none"
                      value={selectedVariantId}
                      onChange={(e) => setSelectedVariantId(e.target.value)}
                    >
                      <option value="">Standard / Default</option>
                      {selectedProduct.variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.attribute}: {v.value}{" "}
                          {v.extraPrice > 0
                            ? `(+$${(v.extraPrice / 100).toFixed(2)})`
                            : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Line Type */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-foreground">
                    Billing Schedule
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      className={`flex items-center justify-center gap-1 rounded-lg border p-2 text-xs font-semibold transition-colors ${
                        lineType === "ONE_TIME"
                          ? "border-primary bg-primary-light/20 text-primary-dark"
                          : "border-border bg-surface text-muted-foreground hover:bg-surface-muted"
                      }`}
                      type="button"
                      onClick={() => setLineType("ONE_TIME")}
                    >
                      <Briefcase className="size-3" /> One-Time
                    </button>
                    <button
                      className={`flex items-center justify-center gap-1 rounded-lg border p-2 text-xs font-semibold transition-colors ${
                        lineType === "RECURRING"
                          ? "border-secondary bg-secondary-light/20 text-secondary-dark"
                          : "border-border bg-surface text-muted-foreground hover:bg-surface-muted"
                      }`}
                      type="button"
                      onClick={() => setLineType("RECURRING")}
                    >
                      <Repeat className="size-3" /> Recurring
                    </button>
                  </div>
                </div>

                {/* Quantity & Initial Line Discount */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-foreground">
                      Quantity
                    </label>
                    <Input
                      className="h-9 w-full px-2.5 text-xs"
                      min={1}
                      type="number"
                      value={qty}
                      onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-foreground">
                      Discount %
                    </label>
                    <Input
                      className="h-9 w-full px-2.5 text-xs"
                      max={100}
                      min={0}
                      step={0.5}
                      type="number"
                      value={discountPct}
                      onChange={(e) =>
                        setDiscountPct(
                          Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)),
                        )
                      }
                    />
                  </div>
                </div>

                {/* Line Total Preview */}
                <div className="space-y-1 rounded-lg border border-border bg-surface p-3 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Line Subtotal:</span>
                    <span className="font-mono">
                      ${((computedUnitCents * qty) / 100).toFixed(2)}
                    </span>
                  </div>
                  {discountPct > 0 && (
                    <div className="flex justify-between text-danger-dark">
                      <span>Discount ({discountPct}%):</span>
                      <span className="font-mono">
                        -$
                        {(
                          (computedUnitCents * qty * (discountPct / 100)) /
                          100
                        ).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-border pt-1 font-bold text-foreground">
                    <span>Net Total:</span>
                    <span className="font-mono text-primary">
                      -$
                      {(
                        (computedUnitCents * qty * (1 - discountPct / 100)) /
                        100
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-48 flex-col items-center justify-center text-center text-xs text-muted-foreground">
                <Cpu className="mb-1 size-6 opacity-40" />
                Select a product from the catalog on the left to configure.
              </div>
            )}

            <Button
              className="w-full"
              disabled={!selectedProductId || isAdding}
              size="sm"
              variant="primary"
              onClick={handleAdd}
            >
              <Plus className="mr-1.5 size-3.5" />
              {isAdding ? "Adding Line..." : "Add to Quotation"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
