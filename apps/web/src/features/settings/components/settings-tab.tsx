import { useState } from "react";
import {
  Bot,
  RotateCcw,
  Save,
  ShieldCheck,
  Sliders,
  Sparkles,
} from "lucide-react";
import type { SystemSetting } from "@template/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useSettings, useUpdateSetting } from "../hooks/use-admin-settings";

const CATEGORY_META: Record<
  string,
  { label: string; icon: typeof Sliders; tone: "primary" | "warning" | "secondary" | "neutral" }
> = {
  risk: { label: "Discount Risk & Finance Escalation", icon: ShieldCheck, tone: "warning" },
  health: { label: "Deal Health Telemetry & Anomaly Horizon", icon: Sliders, tone: "primary" },
  ai: { label: "Autonomous AI & Agent Foundation", icon: Bot, tone: "secondary" },
  general: { label: "General System Settings", icon: Sparkles, tone: "neutral" },
};

export function SettingsTab() {
  const { data: settings, isLoading } = useSettings();
  const updateMutation = useUpdateSetting();
  const [drafts, setDrafts] = useState<Record<string, unknown>>({});

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  const grouped = (settings ?? []).reduce<Record<string, SystemSetting[]>>((acc, s) => {
    const cat = s.category || "general";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  const handleDraftChange = (key: string, value: unknown) => {
    setDrafts((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async (key: string) => {
    const value = drafts[key];
    if (value === undefined) return;
    await updateMutation.mutateAsync({ key, value });
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleToggle = async (key: string, currentValue: boolean) => {
    await updateMutation.mutateAsync({ key, value: !currentValue });
  };

  const handleResetRow = (key: string) => {
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([category, items]) => {
        const meta = CATEGORY_META[category] ?? {
          label: "General Settings",
          icon: Sparkles,
          tone: "neutral" as const,
        };
        const Icon = meta.icon;

        return (
          <div
            key={category}
            className="surface-card rounded-2xl border border-border overflow-hidden shadow-sm"
          >
            {/* Category Header */}
            <div className="flex items-center justify-between p-5 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Icon className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">{meta.label}</h3>
                  <p className="text-xs text-muted-foreground">
                    Runtime configurable parameters governing automated system decisions.
                  </p>
                </div>
              </div>
              <Badge tone={meta.tone} className="text-xs capitalize font-semibold">
                {category}
              </Badge>
            </div>

            {/* Settings Rows */}
            <div className="divide-y divide-border/60">
              {items.map((s) => {
                const isBoolean = typeof s.value === "boolean";
                const isDirty = drafts[s.key] !== undefined && drafts[s.key] !== s.value;
                const currentValue = drafts[s.key] !== undefined ? drafts[s.key] : s.value;

                return (
                  <div
                    key={s.key}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-muted/20 transition-colors"
                  >
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {s.label}
                        </span>
                        <code className="text-[11px] font-mono bg-surface-muted px-2 py-0.5 rounded text-muted-foreground">
                          {s.key}
                        </code>
                      </div>
                      <p className="text-xs text-muted-foreground">{s.description}</p>
                      {s.key.includes("Minor") && typeof currentValue === "number" && (
                        <p className="text-[11px] font-mono text-primary">
                          Value representation: ${(currentValue / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>

                    {/* Value Controls */}
                    <div className="flex items-center gap-3 shrink-0">
                      {isBoolean ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggle(s.key, Boolean(s.value))}
                            disabled={updateMutation.isPending}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                              s.value ? "bg-primary" : "bg-surface-muted"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                s.value ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                          <span className="text-xs font-semibold text-foreground w-16">
                            {s.value ? "Active" : "Disabled"}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={Number(currentValue)}
                            onChange={(e) =>
                              handleDraftChange(s.key, Number(e.target.value))
                            }
                            className="h-8 w-28 text-xs font-mono"
                          />

                          {isDirty && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleSave(s.key)}
                                disabled={updateMutation.isPending}
                                className="h-8 px-2.5 text-xs gap-1"
                              >
                                <Save className="size-3" /> Save
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResetRow(s.key)}
                                className="h-8 px-2 text-xs text-muted-foreground"
                              >
                                <RotateCcw className="size-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
