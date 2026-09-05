import { useState } from "react";
import {
  FileText,
  Lock,
  Settings as SettingsIcon,
  ShieldCheck,
  Sliders,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth-store";
import { AuditLogTab } from "../components/audit-log-tab";
import { GovernanceTab } from "../components/governance-tab";
import { SettingsTab } from "../components/settings-tab";

type ActiveTab = "settings" | "audit" | "governance";

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? "sales_rep";
  const isAdmin = role === "admin";

  const [activeTab, setActiveTab] = useState<ActiveTab>("settings");

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-primary/10 p-2 text-primary">
              <SettingsIcon className="size-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              System Configuration & Compliance
            </h1>
            <Badge
              tone={isAdmin ? "primary" : "warning"}
              className="text-xs font-mono capitalize"
            >
              Role: {role.replace(/_/g, " ")}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            PS A1/A3 Centralized administration: runtime risk parameters, SOC2/ISO compliance audit trail, and discount governance.
          </p>
        </div>
      </div>

      {/* Role Notice for Non-Admins */}
      {!isAdmin && (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-600 dark:text-amber-400">
          <Lock className="size-4 shrink-0" />
          <span>
            <strong>Read-Only Mode:</strong> You are signed in as a <strong>{role.replace(/_/g, " ")}</strong>. System settings modification and global compliance audit log mutations are restricted to users with the <strong>Administrator</strong> role.
          </span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-colors border-b-2 -mb-1 ${
            activeTab === "settings"
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-surface-muted/30"
          }`}
        >
          <Sliders className="size-3.5" />
          <span>System Settings</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-colors border-b-2 -mb-1 ${
            activeTab === "audit"
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-surface-muted/30"
          }`}
        >
          <FileText className="size-3.5" />
          <span>Compliance Audit Trail</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("governance")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-colors border-b-2 -mb-1 ${
            activeTab === "governance"
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-surface-muted/30"
          }`}
        >
          <ShieldCheck className="size-3.5" />
          <span>Discount Governance</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="pt-2">
        {activeTab === "settings" && <SettingsTab />}
        {activeTab === "audit" && <AuditLogTab />}
        {activeTab === "governance" && <GovernanceTab />}
      </div>
    </div>
  );
}
