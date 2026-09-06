import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  FileSpreadsheet,
  GitPullRequest,
  LayoutDashboard,
  LogIn,
  Package,
  Receipt,
  Settings,
  ShieldCheck,
  Truck,
  Users,
} from "lucide-react";
import { appRoutes } from "@template/shared";

export type RoleType = "sales_rep" | "sales_manager" | "finance" | "admin";

export type NavigationItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  roles?: RoleType[];
};

export type NavigationSection = {
  title: string;
  items: NavigationItem[];
};

export const navigationSections: NavigationSection[] = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        href: appRoutes.dashboard,
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Sales",
    items: [
      {
        title: "Quotations",
        href: appRoutes.quotations,
        icon: FileSpreadsheet,
      },
      {
        title: "Products",
        href: appRoutes.products,
        icon: Package,
      },
      {
        title: "Customers",
        href: appRoutes.customers,
        icon: Users,
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        title: "Discount Governance",
        href: appRoutes.governance,
        icon: ShieldCheck,
        roles: ["admin"],
      },
      {
        title: "Approvals",
        href: appRoutes.approvals,
        icon: GitPullRequest,
        roles: ["sales_rep", "sales_manager", "finance", "admin"],
      },
      {
        title: "Fulfillment",
        href: appRoutes.fulfillment,
        icon: Truck,
        roles: ["finance", "admin"],
      },
      {
        title: "Billing",
        href: appRoutes.billing,
        icon: Receipt,
        roles: ["finance", "admin"],
      },
    ],
  },
  {
    title: "Insights",
    items: [
      {
        title: "Deal Health",
        href: appRoutes.dealHealth,
        icon: Activity,
      },
      {
        title: "Reports",
        href: appRoutes.reports,
        icon: BarChart3,
      },
      {
        title: "Settings",
        href: appRoutes.settings,
        icon: Settings,
        roles: ["admin"],
      },
    ],
  },
];

// Flat list for general access or simple navigation
export const privateNavigation: NavigationItem[] = navigationSections.flatMap(
  (section) => section.items,
);

export const publicNavigation: NavigationItem[] = [
  {
    title: "Login",
    href: appRoutes.login,
    icon: LogIn,
  },
];
