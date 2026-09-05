import type { MetaFunction } from "react-router";
import ReportsPage from "@/features/reports/pages/reports-page";

export const meta: MetaFunction = () => {
  return [
    { title: "Executive Reporting & Analytics · DealFlow360" },
    {
      name: "description",
      content:
        "PS A7 Single-dataset reporting dashboard with sales totals, discount leakage, pipeline funnels, and streaming XLSX/PDF exports.",
    },
  ];
};

export default function ReportsRoute() {
  return <ReportsPage />;
}
