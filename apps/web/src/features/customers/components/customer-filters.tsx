import { type CustomerTier } from "@template/shared";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";

export type TierFilterType = CustomerTier | "ALL";

interface CustomerFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedTier: TierFilterType;
  onTierChange: (tier: TierFilterType) => void;
}

const TIER_TABS: { label: string; value: TierFilterType }[] = [
  { label: "All Accounts", value: "ALL" },
  { label: "Gold Tier", value: "GOLD" },
  { label: "Silver Tier", value: "SILVER" },
  { label: "Bronze Tier", value: "BRONZE" },
];

export function CustomerFilters({
  searchQuery,
  onSearchChange,
  selectedTier,
  onTierChange,
}: CustomerFiltersProps) {
  return (
    <div className="bg-card/60 flex flex-col gap-4 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Search Input */}
      <div className="relative min-w-0 w-full flex-1 sm:min-w-64">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pr-8 pl-9"
          placeholder="Search by company name, contact, or industry..."
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

      {/* Tier Filter Tabs */}
      <div className="-mx-1 flex max-w-full overflow-x-auto px-1">
        <div className="bg-muted/60 flex min-w-max items-center rounded-lg border border-border p-1">
          {TIER_TABS.map((tab) => {
            const isSelected = selectedTier === tab.value;
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
                onClick={() => onTierChange(tab.value)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
