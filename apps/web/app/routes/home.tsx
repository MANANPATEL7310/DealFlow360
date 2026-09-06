import type { MetaFunction } from "react-router";
import { HomePage } from "@/features/marketing/pages/home-page";

export const meta: MetaFunction = () => {
  return [
    { title: "DealFlow360 · Quote-to-cash for B2B sales teams" },
    {
      name: "description",
      content:
        "One platform for quoting, discount approvals, multi-warehouse fulfillment, and hybrid billing — from quote to cash without the manual back-and-forth.",
    },
  ];
};

export default function HomeRoute() {
  return <HomePage />;
}
