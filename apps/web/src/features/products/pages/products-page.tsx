import { useState } from "react";
import { type CreateProductInput, type Product } from "@template/shared";
import { PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type CategoryFilterType,
  CatalogFilters,
} from "@/features/products/components/catalog-filters";
import { CatalogStats } from "@/features/products/components/catalog-stats";
import { ProductCatalogTable } from "@/features/products/components/product-catalog-table";
import { ProductFormDialog } from "@/features/products/components/product-form-dialog";
import { TieredPricingModal } from "@/features/products/components/tiered-pricing-modal";
import { VariantSelectorModal } from "@/features/products/components/variant-selector-modal";
import {
  useCreateProduct,
  useDeleteProduct,
  useProducts,
  useUpdateProduct,
} from "@/features/products/hooks/use-products";
import { useAuthStore } from "@/stores/auth-store";

export function ProductsPage() {
  const user = useAuthStore((s) => s.user);
  const canManage = user?.role === "admin" || user?.role === "sales_manager";

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilterType>("ALL");
  const [promotedOnly, setPromotedOnly] = useState(false);

  // Modal states
  const [tieredModalProduct, setTieredModalProduct] = useState<Product | null>(
    null,
  );
  const [variantModalProduct, setVariantModalProduct] =
    useState<Product | null>(null);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Data queries & mutations
  const { data: products = [], isLoading } = useProducts({
    category: selectedCategory,
    query: searchQuery,
    promotedOnly,
  });

  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();

  const handleCreateOrEditSubmit = (input: CreateProductInput) => {
    if (editingProduct) {
      updateProductMutation.mutate(
        { id: editingProduct.id, input },
        {
          onSuccess: () => {
            setIsFormDialogOpen(false);
            setEditingProduct(null);
          },
        },
      );
    } else {
      createProductMutation.mutate(input, {
        onSuccess: () => {
          setIsFormDialogOpen(false);
        },
      });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormDialogOpen(true);
  };

  const handleDelete = (product: Product) => {
    if (
      window.confirm(
        `Are you sure you want to remove "${product.name}" from the active catalog?`,
      )
    ) {
      deleteProductMutation.mutate(product.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Product & Price List Engine
            </h1>
            <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Module M1
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Multi-tier price schedules, item variant surcharges, and catalog
            margin compliance floors.
          </p>
        </div>

        {canManage && (
          <Button
            className="gap-2"
            type="button"
            onClick={() => {
              setEditingProduct(null);
              setIsFormDialogOpen(true);
            }}
          >
            <PackagePlus className="size-4" />
            <span>Add Catalog Item</span>
          </Button>
        )}
      </div>

      {/* Stats Bar */}
      <CatalogStats isLoading={isLoading} products={products} />

      {/* Search & Category Filter Controls */}
      <CatalogFilters
        promotedOnly={promotedOnly}
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        onPromotedOnlyChange={setPromotedOnly}
        onSearchChange={setSearchQuery}
      />

      {/* Catalog Table */}
      <ProductCatalogTable
        canManage={canManage}
        isLoading={isLoading}
        products={products}
        onDeleteProduct={handleDelete}
        onEditProduct={handleEdit}
        onOpenTieredPricing={(p) => setTieredModalProduct(p)}
        onOpenVariants={(p) => setVariantModalProduct(p)}
      />

      {/* Interactive Modals */}
      <TieredPricingModal
        isOpen={Boolean(tieredModalProduct)}
        product={tieredModalProduct}
        onClose={() => setTieredModalProduct(null)}
      />

      <VariantSelectorModal
        isOpen={Boolean(variantModalProduct)}
        product={variantModalProduct}
        onClose={() => setVariantModalProduct(null)}
      />

      <ProductFormDialog
        initialProduct={editingProduct}
        isPending={
          createProductMutation.isPending || updateProductMutation.isPending
        }
        isOpen={isFormDialogOpen}
        onClose={() => {
          setIsFormDialogOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleCreateOrEditSubmit}
      />
    </div>
  );
}
