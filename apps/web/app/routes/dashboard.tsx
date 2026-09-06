import type { MetaFunction } from "react-router";
import { DashboardPage } from "@/features/dashboard/pages/dashboard-page";

export const meta: MetaFunction = () => {
  return [
    { title: "Dashboard · DealFlow360" },
    {
      name: "description",
      content: "DealFlow360 executive command center and quotation operations.",
    },
  ];
};

export default function DashboardRoute() {
  return <DashboardPage />;
}
