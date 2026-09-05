import type { MetaFunction } from "react-router";
import { PortalPage } from "@/features/portal/pages/portal-page";

export const meta: MetaFunction = () => {
  return [
    { title: "Commercial Proposal · DealFlow360 Customer Portal" },
    {
      name: "description",
      content:
        "Secure client portal for reviewing quotations, proposing commercial adjustments, and authorizing proposals.",
    },
  ];
};

export default function PortalRoute() {
  return <PortalPage />;
}
