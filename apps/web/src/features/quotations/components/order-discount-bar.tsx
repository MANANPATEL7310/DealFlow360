import { useState } from "react";
import { Check, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface OrderDiscountBarProps {
  onApplyAll: (discountPct: number) => void;
  disabled?: boolean;
}

export function OrderDiscountBar({
  onApplyAll,
  disabled,
}: OrderDiscountBarProps) {
  const [orderDiscount, setOrderDiscount] = useState<string>("5.0");

  const handleApply = () => {
    const num = parseFloat(orderDiscount);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      onApplyAll(num);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Percent className="size-3.5" />
        </div>
        <div>
          <div className="text-xs font-semibold text-foreground">
            Bulk Order-Level Discount
          </div>
          <div className="text-xs text-muted-foreground">
            Propagates uniform target discount across all active lines.
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative w-24">
          <Input
            className="h-8 w-full pr-5 text-right font-mono text-xs"
            disabled={disabled}
            max={100}
            min={0}
            step={0.5}
            type="number"
            value={orderDiscount}
            onChange={(e) => setOrderDiscount(e.target.value)}
          />
          <span className="pointer-events-none absolute top-1.5 right-2 text-xs font-semibold text-muted-foreground">
            %
          </span>
        </div>
        <Button
          className="h-8 px-3 text-xs"
          disabled={disabled}
          size="sm"
          variant="secondary"
          onClick={handleApply}
        >
          <Check className="mr-1 size-3" /> Apply to All Lines
        </Button>
      </div>
    </div>
  );
}
