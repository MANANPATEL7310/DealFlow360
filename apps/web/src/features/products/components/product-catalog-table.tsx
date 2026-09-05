import { type Product, type ProductCategory } from "@template/shared";
import {
  Boxes,
  Cpu,
  Edit2,
  Layers,
  Percent,
  Sparkles,
  Trash2,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";

interface ProductCatalogTableProps {
  products: Product[];
  isLoading?: boolean;
  onOpenTieredPricing: (product: Product) => void;
  onOpenVariants: (product: Product) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  canManage?: boolean;
}

export function ProductCatalogTable({
  products,
  isLoading,
  onOpenTieredPricing,
  onOpenVariants,
  onEditProduct,
  onDeleteProduct,
  canManage = false,
}: ProductCatalogTableProps) {
  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const getCategoryBadge = (category: ProductCategory) => {
    switch (category) {
      case "HARDWARE":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "SUBSCRIPTIONS":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "SERVICES":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card space-y-4 rounded-xl border border-border p-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-4 border-b border-border/40 pb-4"
          >
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        description="No products matched your search or category filter. Try changing the query or clearing filters."
        icon={Boxes}
        title="No Products Found"
      />
    );
  }

  return (
    <div className="bg-card overflow-x-auto rounded-xl border border-border shadow-xs">
      <table className="w-full text-left text-xs">
        <thead className="bg-muted/50 border-b border-border/80 font-semibold tracking-wider text-muted-foreground uppercase">
          <tr>
            <th className="px-5 py-3.5">Product & Description</th>
            <th className="px-4 py-3.5">Category</th>
            <th className="px-4 py-3.5">Unit</th>
            <th className="px-4 py-3.5">Unit Cost</th>
            <th className="px-4 py-3.5">Base List Price</th>
            <th className="px-4 py-3.5">Margin %</th>
            <th className="px-4 py-3.5 text-center">Variants</th>
            <th className="px-4 py-3.5 text-center">Tier Matrix</th>
            {canManage && <th className="px-4 py-3.5 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {products.map((product) => {
            const marginPct =
              product.basePrice > 0
                ? Math.round(
                    ((product.basePrice - product.unitCost) /
                      product.basePrice) *
                      1000,
                  ) / 10
                : 0;

            return (
              <tr
                key={product.id}
                className="hover:bg-muted/40 transition-colors"
              >
                {/* Product Name & Description */}
                <td className="max-w-xs px-5 py-4">
                  <div className="flex items-start gap-2">
                    {product.isPromoted && (
                      <Sparkles className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                    )}
                    <div>
                      <span className="font-semibold text-foreground">
                        {product.name}
                      </span>
                      {product.description && (
                        <p className="mt-0.5 line-clamp-1 text-muted-foreground">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </div>
                </td>

                {/* Category Badge */}
                <td className="p-4 whitespace-nowrap">
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize",
                      getCategoryBadge(product.category),
                    )}
                  >
                    {product.category.toLowerCase()}
                  </span>
                </td>

                {/* Unit of Measure */}
                <td className="p-4 font-medium whitespace-nowrap text-muted-foreground">
                  {product.unit}
                </td>

                {/* Unit Cost */}
                <td className="p-4 font-medium whitespace-nowrap text-muted-foreground">
                  {formatPrice(product.unitCost)}
                </td>

                {/* Base List Price */}
                <td className="p-4 font-bold whitespace-nowrap text-foreground">
                  {formatPrice(product.basePrice)}
                </td>

                {/* Margin % */}
                <td className="p-4 whitespace-nowrap">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-bold",
                      marginPct >= 30
                        ? "bg-emerald-500/10 text-emerald-500"
                        : marginPct >= 15
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-rose-500/10 text-rose-500",
                    )}
                  >
                    <Percent className="size-3" />
                    {marginPct}%
                  </span>
                </td>

                {/* Variants Trigger */}
                <td className="p-4 text-center whitespace-nowrap">
                  <button
                    className="bg-card hover:bg-muted inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-foreground transition-colors hover:border-primary/40"
                    type="button"
                    onClick={() => onOpenVariants(product)}
                  >
                    <Cpu className="size-3.5 text-primary" />
                    <span>{product.variants.length}</span>
                  </button>
                </td>

                {/* Tier Matrix Trigger */}
                <td className="p-4 text-center whitespace-nowrap">
                  <button
                    className="bg-card inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:border-primary hover:bg-primary/10"
                    type="button"
                    onClick={() => onOpenTieredPricing(product)}
                  >
                    <Layers className="size-3.5" />
                    <span>Schedules</span>
                  </button>
                </td>

                {/* Admin Actions */}
                {canManage && (
                  <td className="p-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        className="hover:bg-muted rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                        title="Edit Product"
                        type="button"
                        onClick={() => onEditProduct(product)}
                      >
                        <Edit2 className="size-3.5" />
                      </button>
                      <button
                        className="rounded-md p-1.5 text-rose-500 transition-colors hover:bg-rose-500/10"
                        title="Delete Product"
                        type="button"
                        onClick={() => onDeleteProduct(product)}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
