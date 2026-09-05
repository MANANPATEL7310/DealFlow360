import type { MetaFunction } from "react-router";
import { ApprovalsPage } from "@/features/approvals/pages/approvals-page";

export const meta: MetaFunction = () => {
  return [
    { title: "AI Approvals | DealFlow360" },
    {
      name: "description",
      content: "Human-in-the-loop governance queue for AI proposals.",
    },
  ];
};

export default function ApprovalsRoute() {
  return <ApprovalsPage />;
}
