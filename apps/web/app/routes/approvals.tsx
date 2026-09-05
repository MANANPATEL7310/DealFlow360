import { ApprovalsInboxPage } from "@/features/approvals/pages/approvals-inbox-page";

export function meta() {
  return [
    { title: "Deal Approvals Inbox · DealFlow360" },
    {
      name: "description",
      content:
        "Manage pending quotation approvals, sequential multi-tier decision chains, and deal risk governance.",
    },
  ];
}

export default function ApprovalsRoute() {
  return <ApprovalsInboxPage />;
}
