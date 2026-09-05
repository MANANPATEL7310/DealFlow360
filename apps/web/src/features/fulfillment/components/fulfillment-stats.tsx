import type { FulfillmentPlan } from "@template/shared";
import {
  AlertTriangle,
  Boxes,
  DollarSign,
  Truck,
} from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";

interface FulfillmentStatsProps {
  plan: FulfillmentPlan | null;
  isLoading?: boolean;
}

export function FulfillmentStats({ plan, isLoading }: FulfillmentStatsProps) {
  const splits = plan?.splits ?? [];
  const backorders = plan?.backorders ?? [];

  const shipmentCount = new Set(splits.map((s) => s.warehouseId)).size;
  const totalFreightMinor = splits.reduce(
    (sum, s) => sum + s.shipmentCostMinor,
    0,
  );
  const totalAllocatedQty = splits.reduce((sum, s) => sum + s.qty, 0);
  const openBackordersCount = backorders.filter(
    (b) => b.qtyOutstanding > 0,
  ).length;

  const freightFormatted = `$${(totalFreightMinor / 100).toFixed(2)}`;

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <MetricCard
        icon={Truck}
        loading={isLoading}
        title="Consolidated Shipments"
        value={shipmentCount.toString()}
      />
      <MetricCard
        icon={DollarSign}
        loading={isLoading}
        title="Est. Shipping Freight"
        value={freightFormatted}
      />
      <MetricCard
        icon={Boxes}
        loading={isLoading}
        title="Allocated Units"
        value={totalAllocatedQty.toString()}
      />
      <MetricCard
        icon={AlertTriangle}
        loading={isLoading}
        title="Open Backorders"
        value={openBackordersCount.toString()}
      />
    </div>
  );
}
