import { QuotationsPage } from "@/features/quotations/pages/quotations-page";

export function meta() {
  return [
    { title: "Quotations · DealFlow360" },
    {
      name: "description",
      content:
        "Manage active quotation pipeline, discount policy evaluations, and multi-tier approval workflows.",
    },
  ];
}

export default function QuotationsRoute() {
  return <QuotationsPage />;
}
