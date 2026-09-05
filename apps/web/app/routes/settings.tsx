import type { MetaFunction } from "react-router";
import { SettingsPage } from "@/features/settings/pages/settings-page";

export const meta: MetaFunction = () => {
  return [
    { title: "Settings | Template" },
    {
      name: "description",
      content: "Manage user preferences and settings.",
    },
  ];
};

export default function SettingsRoute() {
  return <SettingsPage />;
}
