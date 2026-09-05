import type { MetaFunction } from "react-router";
import { DashboardPage } from "@/features/dashboard/pages/dashboard-page";

export const meta: MetaFunction = () => {
  return [
    { title: "Dashboard | Template" },
    {
      name: "description",
      content: "Manage your applications and workspace.",
    },
  ];
};

export default function DashboardRoute() {
  return <DashboardPage />;
}
