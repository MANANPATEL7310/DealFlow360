import { type ProductCategory } from "@template/shared";
import { Search, Sparkles, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";

export type CategoryFilterType = ProductCategory | "ALL";

interface CatalogFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: CategoryFilterType;
  onCategoryChange: (cat: CategoryFilterType) => void;
  promotedOnly: boolean;
  onPromotedOnlyChange: (promoted: boolean) => void;
}

const CATEGORY_TABS: { label: string; value: CategoryFilterType }[] = [
  { label: "All Products", value: "ALL" },
  { label: "Hardware", value: "HARDWARE" },
  { label: "Subscriptions", value: "SUBSCRIPTIONS" },
  { label: "Services", value: "SERVICES" },
];

export function CatalogFilters({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  promotedOnly,
  onPromotedOnlyChange,
}: CatalogFiltersProps) {
  return (
    <div className="bg-card/60 flex flex-col gap-4 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Search Input */}
      <div className="relative min-w-0 w-full flex-1 sm:min-w-64">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pr-8 pl-9"
          placeholder="Search by product name, SKU, or specs..."
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchQuery.length > 0 && (
          <button
            className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            type="button"
            onClick={() => onSearchChange("")}
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Category Pills & Promoted Switch */}
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
        <div className="-mx-1 flex max-w-full overflow-x-auto px-1">
          <div className="bg-muted/60 flex min-w-max items-center rounded-lg border border-border p-1">
            {CATEGORY_TABS.map((tab) => {
              const isSelected = selectedCategory === tab.value;
              return (
                <button
                  key={tab.value}
                  className={cn(
                    "whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold transition-all",
                    isSelected
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  type="button"
                  onClick={() => onCategoryChange(tab.value)}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <button
          className={cn(
            "flex w-fit items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
            promotedOnly
              ? "border-amber-500/30 bg-amber-500/10 text-amber-500 shadow-xs"
              : "bg-card border-border text-muted-foreground hover:text-foreground",
          )}
          type="button"
          onClick={() => onPromotedOnlyChange(!promotedOnly)}
        >
          <Sparkles className="size-3.5" />
          <span>Promoted Only</span>
        </button>
      </div>
    </div>
  );
}
