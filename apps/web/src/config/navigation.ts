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
    title: "Command Center",
    items: [
      {
        title: "Executive Dashboard",
        href: appRoutes.dashboard,
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Sales Workspace",
    items: [
      {
        title: "Quotations",
        href: appRoutes.quotations,
        icon: FileSpreadsheet,
      },
      {
        title: "Products & Pricing",
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
    title: "Governance & Ops",
    items: [
      {
        title: "Discount Governance",
        href: appRoutes.governance,
        icon: ShieldCheck,
        roles: ["admin"],
      },
      {
        title: "Approvals Inbox",
        href: appRoutes.approvals,
        icon: GitPullRequest,
        roles: ["sales_rep", "sales_manager", "finance", "admin"],
      },
      {
        title: "Fulfillment & Stock",
        href: appRoutes.fulfillment,
        icon: Truck,
        roles: ["finance", "admin"],
      },
      {
        title: "Hybrid Billing",
        href: appRoutes.billing,
        icon: Receipt,
        roles: ["finance", "admin"],
      },
    ],
  },
  {
    title: "Intelligence & Config",
    items: [
      {
        title: "Deal Health Radar",
        href: appRoutes.dealHealth,
        icon: Activity,
      },
      {
        title: "Reports & Analytics",
        href: appRoutes.reports,
        icon: BarChart3,
      },
      {
        title: "System Settings",
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
