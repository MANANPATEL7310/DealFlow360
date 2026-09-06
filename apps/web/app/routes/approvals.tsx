import type { MetaFunction } from "react-router";
import { ApprovalsInboxPage } from "@/features/approvals/pages/approvals-inbox-page";

export const meta: MetaFunction = () => {
  return [
    { title: "Approvals · DealFlow360" },
    {
      name: "description",
      content:
        "Manage pending quotation approvals, sequential multi-tier decision chains, and AI HITL proposed actions.",
    },
  ];
};

export default function ApprovalsRoute() {
  return <ApprovalsInboxPage />;
}
