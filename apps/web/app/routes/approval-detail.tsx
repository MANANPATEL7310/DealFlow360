import { ApprovalDetailPage } from "@/features/approvals/pages/approval-detail-page";

export function meta() {
  return [
    { title: "Approval Review · DealFlow360" },
    {
      name: "description",
      content:
        "Inspect commercial line discounts, governance policy compliance, and submit sequential approval decisions.",
    },
  ];
}

export default function ApprovalDetailRoute() {
  return <ApprovalDetailPage />;
}
