import type { MetaFunction } from "react-router";
import { DealHealthPage } from "@/features/deal-health/pages/deal-health-page";

export const meta: MetaFunction = () => {
  return [
    { title: "Deal Health · DealFlow360" },
    {
      name: "description",
      content:
        "Autonomous pipeline health telemetry monitoring stagnation, discount anomalies, and fulfillment slippages.",
    },
  ];
};

export default function DealHealthRoute() {
  return <DealHealthPage />;
}
