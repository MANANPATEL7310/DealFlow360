import type { Product } from "@template/shared";
import {
  Boxes,
  Cpu,
  Layers,
  Percent,
  RefreshCw,
} from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";

interface CatalogStatsProps {
  products: Product[];
  isLoading?: boolean;
}

export function CatalogStats({ products, isLoading }: CatalogStatsProps) {
  const total = products.length;
  const hardwareCount = products.filter((p) => p.category === "HARDWARE").length;
  const subCount = products.filter(
    (p) => p.category === "SUBSCRIPTIONS",
  ).length;
  const servicesCount = products.filter(
    (p) => p.category === "SERVICES",
  ).length;

  const avgMargin =
    total > 0
      ? Math.round(
          (products.reduce((acc, p) => {
            if (p.basePrice <= 0) return acc;
            return acc + ((p.basePrice - p.unitCost) / p.basePrice) * 100;
          }, 0) /
            total) *
            10,
        ) / 10
      : 0;

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
      <MetricCard
        icon={Boxes}
        loading={isLoading}
        title="Active Catalog Items"
        value={total.toString()}
      />
      <MetricCard
        icon={Cpu}
        loading={isLoading}
        title="Hardware SKUs"
        value={hardwareCount.toString()}
      />
      <MetricCard
        icon={RefreshCw}
        loading={isLoading}
        title="Recurring SaaS"
        value={subCount.toString()}
      />
      <MetricCard
        icon={Layers}
        loading={isLoading}
        title="Professional Services"
        value={servicesCount.toString()}
      />
      <MetricCard
        icon={Percent}
        loading={isLoading}
        title="Avg Catalog Margin"
        value={`${avgMargin}%`}
      />
    </div>
  );
}
