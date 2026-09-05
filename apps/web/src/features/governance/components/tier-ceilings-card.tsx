import { useState } from "react";
import type { CustomerTier, DiscountTierCeiling } from "@template/shared";
import { Check, Edit3, ShieldAlert, ShieldCheck } from "lucide-react";
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
  useDiscountTiers,
  useUpsertDiscountTier,
} from "@/features/governance/hooks/use-governance";

const TIER_METADATA: Record<
  CustomerTier,
  {
    label: string;
    description: string;
    badgeTone: "primary" | "secondary" | "warning";
  }
> = {
  GOLD: {
    label: "Strategic Tier (Gold)",
    description: "Enterprise strategic accounts with >$100k credit lines.",
    badgeTone: "primary",
  },
  SILVER: {
    label: "Mid-Market (Silver)",
    description: "Standard commercial accounts with recurring contracts.",
    badgeTone: "secondary",
  },
  BRONZE: {
    label: "Growth & SMB (Bronze)",
    description: "New client accounts or self-service transactors.",
    badgeTone: "warning",
  },
};

const ALL_TIERS: CustomerTier[] = ["GOLD", "SILVER", "BRONZE"];

interface TierCeilingRowProps {
  tier: CustomerTier;
  ceiling?: DiscountTierCeiling;
  onSave: (tier: CustomerTier, pct: number) => void;
  isSaving: boolean;
}

function TierCeilingRow({
  tier,
  ceiling,
  onSave,
  isSaving,
}: TierCeilingRowProps) {
  const currentPct = ceiling?.maxDiscountPct ?? 0;
  const [value, setValue] = useState(currentPct.toString());
  const meta = TIER_METADATA[tier];

  const numVal = parseFloat(value);
  const isDirty = !isNaN(numVal) && numVal !== currentPct;
  const isValid = !isNaN(numVal) && numVal >= 0 && numVal <= 100;

  const handleSave = () => {
    if (isValid && isDirty) {
      onSave(tier, numVal);
    }
  };

  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          <Badge tone={meta.badgeTone}>{tier}</Badge>
          <div>
            <div className="text-sm font-semibold text-foreground">
              {meta.label}
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
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, currentPct))}%` }}
            />
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            {currentPct}% Max
          </span>
        </div>
      </TableCell>
      <TableCell className="text-right">
        {currentPct > 0 ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-success-dark">
            <ShieldCheck className="size-3.5" /> Enforced
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-warning-dark">
            <ShieldAlert className="size-3.5" /> 0% Unconfigured
          </span>
        )}
      </TableCell>
    </TableRow>
  );
}

export function TierCeilingsCard() {
  const { data: tiers, isLoading } = useDiscountTiers();
  const upsertTier = useUpsertDiscountTier();

  const handleSave = (customerTier: CustomerTier, maxDiscountPct: number) => {
    upsertTier.mutate({ customerTier, maxDiscountPct });
  };

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Edit3 className="size-4 text-primary" /> Customer Tier Ceilings
          </h2>
          <p className="text-xs text-muted-foreground">
            Governs the maximum allowable discount percentage based on the
            customer's negotiated tier standing.
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
              <TableHead>Customer Tier</TableHead>
              <TableHead>Discount Ceiling</TableHead>
              <TableHead>Policy Margin Bar</TableHead>
              <TableHead className="text-right">Governance Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ALL_TIERS.map((tier) => {
              const ceiling = tiers?.find((t) => t.customerTier === tier);
              return (
                <TierCeilingRow
                  key={tier}
                  ceiling={ceiling}
                  isSaving={upsertTier.isPending}
                  tier={tier}
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
