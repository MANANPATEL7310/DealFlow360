import { useState } from "react";
import type {
  CategoryDiscountCeiling,
  ProductCategory,
} from "@template/shared";
import {
  Briefcase,
  Check,
  Cpu,
  Layers,
  Repeat,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useCategoryCeilings,
  useUpsertCategoryCeiling,
} from "@/features/governance/hooks/use-governance";

const CATEGORY_METADATA: Record<
  ProductCategory,
  {
    label: string;
    description: string;
    icon: typeof Cpu;
    tone: "primary" | "secondary" | "warning";
  }
> = {
  HARDWARE: {
    label: "Hardware Devices & Racks",
    description: "Physical capital equipment with direct unit COGS limits.",
    icon: Cpu,
    tone: "primary",
  },
  SERVICES: {
    label: "Professional Services",
    description: "Deployment, migration, and customer engineering hours.",
    icon: Briefcase,
    tone: "secondary",
  },
  SUBSCRIPTIONS: {
    label: "Cloud & SaaS Subscriptions",
    description: "Recurring software access licenses and data platform tiers.",
    icon: Repeat,
    tone: "warning",
  },
};

const ALL_CATEGORIES: ProductCategory[] = [
  "HARDWARE",
  "SERVICES",
  "SUBSCRIPTIONS",
];

interface CategoryCeilingRowProps {
  category: ProductCategory;
  ceiling?: CategoryDiscountCeiling;
  onSave: (cat: ProductCategory, pct: number) => void;
  isSaving: boolean;
}

function CategoryCeilingRow({
  category,
  ceiling,
  onSave,
  isSaving,
}: CategoryCeilingRowProps) {
  const currentPct = ceiling?.maxDiscountPct ?? 0;
  const [value, setValue] = useState(currentPct.toString());
  const meta = CATEGORY_METADATA[category];
  const Icon = meta.icon;

  const numVal = parseFloat(value);
  const isDirty = !isNaN(numVal) && numVal !== currentPct;
  const isValid = !isNaN(numVal) && numVal >= 0 && numVal <= 100;

  const handleSave = () => {
    if (isValid && isDirty) {
      onSave(category, numVal);
    }
  };

  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-muted/50 text-foreground">
            <Icon className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                {meta.label}
              </span>
              <Badge tone={meta.tone}>{category}</Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              {meta.description}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex max-w-xs items-center gap-2">
          <div className="relative flex-1">
            <Input
              className="h-9 w-24 pr-6 text-right font-mono text-sm"
              disabled={isSaving}
              max={100}
              min={0}
              step={0.5}
              type="number"
              value={value}
              onBlur={handleSave}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
            />
            <span className="pointer-events-none absolute top-2 right-2 text-xs font-semibold text-muted-foreground">
              %
            </span>
          </div>
          {isDirty && (
            <Button
              className="h-8 px-2 text-xs"
              disabled={!isValid || isSaving}
              size="sm"
              variant="primary"
              onClick={handleSave}
            >
              <Check className="mr-1 size-3" /> Save
            </Button>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="h-2 w-32 overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full bg-secondary transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, currentPct))}%` }}
            />
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            {currentPct}% Cap
          </span>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <span className="inline-flex items-center gap-1 text-xs font-medium text-success-dark">
          <ShieldCheck className="size-3.5" /> Margin Guarded
        </span>
      </TableCell>
    </TableRow>
  );
}

export function CategoryCeilingsCard() {
  const { data: ceilings, isLoading } = useCategoryCeilings();
  const upsertCeiling = useUpsertCategoryCeiling();

  const handleSave = (category: ProductCategory, maxDiscountPct: number) => {
    upsertCeiling.mutate({ category, maxDiscountPct });
  };

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Layers className="size-4 text-secondary" /> Product Category Caps
          </h2>
          <p className="text-xs text-muted-foreground">
            Enforces strict product-line discount ceilings independent of client
            relationship to preserve gross margins.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Category</TableHead>
              <TableHead>Maximum Ceiling</TableHead>
              <TableHead>Margin Safeguard Bar</TableHead>
              <TableHead className="text-right">Enforcement</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ALL_CATEGORIES.map((cat) => {
              const ceiling = ceilings?.find((c) => c.category === cat);
              return (
                <CategoryCeilingRow
                  key={cat}
                  ceiling={ceiling}
                  isSaving={upsertCeiling.isPending}
                  category={cat}
                  onSave={handleSave}
                />
              );
            })}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}
