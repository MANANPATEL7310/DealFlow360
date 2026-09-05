import { useState } from "react";
import { DEMO_PERSONAS, internalRoles, type UserRole } from "@template/shared";
import { Check, ChevronDown, Users } from "lucide-react";
import toast from "react-hot-toast";
import { LogoMark } from "@/components/shared/logo-mark";
import { PrefetchNavLink } from "@/components/shared/prefetch-link";
import { navigationSections } from "@/config/navigation";
import { cn } from "@/lib/cn";
import { useAuthStore } from "@/stores/auth-store";

export function AppSidebar() {
  const user = useAuthStore((s) => s.user);
  const switchPersona = useAuthStore((s) => s.switchPersona);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  const activeRole: UserRole = user?.role ?? "sales_rep";
  const activePersona = DEMO_PERSONAS[activeRole];

  const handleRoleSelect = (role: UserRole) => {
    switchPersona(role);
    const targetPersona = DEMO_PERSONAS[role];
    toast.success(`Switched to ${targetPersona.name} (${targetPersona.title})`);
    setIsSwitcherOpen(false);
  };

  return (
    <aside className="bg-card/50 sticky top-0 z-40 flex h-screen w-64 shrink-0 flex-col justify-between border-r border-border p-4 backdrop-blur-xl">
      <div className="flex flex-col gap-6 overflow-y-auto">
        <div className="border-b border-border/70 pb-3">
          <LogoMark />
        </div>

        <nav className="flex flex-col gap-5">
          {navigationSections.map((section) => {
            const visibleItems = section.items.filter((item) => {
              if (!item.roles || item.roles.length === 0) return true;
              return item.roles.includes(activeRole);
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} className="flex flex-col gap-1.5">
                <p className="px-3 text-xs font-bold tracking-wider text-muted-foreground/70 uppercase">
                  {section.title}
                </p>
                <div className="flex flex-col gap-1">
                  {visibleItems.map((item) => (
                    <PrefetchNavLink
                      key={item.href}
                      to={item.href}
                      end={item.href === "/app"}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                          isActive
                            ? "border border-primary/20 bg-primary/10 font-semibold text-primary shadow-sm"
                            : "text-muted-foreground hover:translate-x-0.5 hover:bg-surface-muted/60 hover:text-foreground",
                        )
                      }
                    >
                      <item.icon className="size-4 shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </PrefetchNavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Role Persona Switcher Footer */}
      <div className="mt-auto border-t border-border/80 pt-3">
        <div className="bg-card/80 rounded-xl border border-border p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg border text-xs font-bold",
                  activePersona.colorClass,
                )}
              >
                {activePersona.avatarInitials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-foreground">
                  {user?.name ?? activePersona.name}
                </p>
                <p className="truncate text-xs text-muted-foreground capitalize">
                  {activeRole.replace("_", " ")}
                </p>
              </div>
            </div>

            <button
              className="bg-muted/60 flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              type="button"
              title="Switch Demo Role"
              onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
            >
              <ChevronDown
                className={cn(
                  "size-3.5 transition-transform duration-200",
                  isSwitcherOpen && "rotate-180",
                )}
              />
            </button>
          </div>

          {/* Collapsible Role Switcher Options */}
          {isSwitcherOpen && (
            <div className="mt-3 space-y-1 border-t border-border/60 pt-2">
              <div className="flex items-center gap-1.5 p-1 text-xs font-semibold text-muted-foreground">
                <Users className="size-3 text-primary" />
                <span>Switch Active Persona:</span>
              </div>
              {internalRoles.map((role) => {
                const persona = DEMO_PERSONAS[role];
                const isSelected = activeRole === role;

                return (
                  <button
                    key={role}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs transition-colors",
                      isSelected
                        ? "bg-primary/10 font-semibold text-primary"
                        : "hover:bg-muted/80 text-muted-foreground hover:text-foreground",
                    )}
                    type="button"
                    onClick={() => handleRoleSelect(role)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">
                        {role.replace("_", " ")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({persona.name})
                      </span>
                    </div>
                    {isSelected && <Check className="size-3 text-primary" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
