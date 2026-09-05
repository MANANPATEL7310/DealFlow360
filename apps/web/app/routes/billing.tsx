import { BillingPage } from "@/features/billing/pages/billing-page";

export function meta() {
  return [
    { title: "Quotation Hybrid Billing · DealFlow360" },
    {
      name: "description",
      content:
        "Manage one-time invoices, multi-period recurring subscription schedules, recorded payments, and mid-cycle proration.",
    },
  ];
}

export default function BillingRoute() {
  return <BillingPage />;
}
