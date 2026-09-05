import { FulfillmentPage } from "@/features/fulfillment/pages/fulfillment-page";

export function meta() {
  return [
    { title: "Warehouse Fulfillment · DealFlow360" },
    {
      name: "description",
      content:
        "Optimize multi-warehouse shipping splits, monitor backorders, and commit physical inventory.",
    },
  ];
}

export default function FulfillmentRoute() {
  return <FulfillmentPage />;
}
