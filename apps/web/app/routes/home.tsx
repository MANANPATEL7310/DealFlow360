import type { MetaFunction } from "react-router";
import { HomePage } from "@/features/marketing/pages/home-page";

export const meta: MetaFunction = () => {
  return [
    { title: "DealFlow360 · Intelligent Self-Governing Sales Operations" },
    {
      name: "description",
      content:
        "Autonomous quotation-to-cash platform with blended discount risk governance, multi-warehouse fulfillment split, and hybrid billing.",
    },
  ];
};

export default function HomeRoute() {
  return <HomePage />;
}
