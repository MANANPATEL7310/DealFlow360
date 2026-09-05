import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, LogIn, Settings } from "lucide-react";
import { appRoutes } from "@template/shared";

export type NavigationItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export const privateNavigation: NavigationItem[] = [
  {
    title: "Dashboard",
    href: appRoutes.dashboard,
    icon: LayoutDashboard,
  },
  {
    title: "Settings",
    href: appRoutes.settings,
    icon: Settings,
  },
];

export const publicNavigation: NavigationItem[] = [
  {
    title: "Login",
    href: appRoutes.login,
    icon: LogIn,
  },
];
