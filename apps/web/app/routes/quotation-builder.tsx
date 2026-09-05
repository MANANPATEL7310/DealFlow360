import { QuotationBuilderPage } from "@/features/quotations/pages/quotation-builder-page";

export function meta() {
  return [
    { title: "Quotation Builder · DealFlow360" },
    {
      name: "description",
      content:
        "Build enterprise multi-line quotations with live margin calculations, discount policy compliance, and approval risk analysis.",
    },
  ];
}

export default function QuotationBuilderRoute() {
  return <QuotationBuilderPage />;
}
