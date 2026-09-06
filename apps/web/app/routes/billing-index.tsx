import { BillingPage } from "@/features/billing/pages/billing-page";

export function meta() {
  return [
    { title: "Billing · DealFlow360" },
    {
      name: "description",
      content:
        "Enterprise split billing management across one-time hardware charges and recurring subscription series.",
    },
  ];
}

export default function BillingIndexRoute() {
  return <BillingPage />;
}
