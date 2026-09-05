import { LogoMark } from "@/components/shared/logo-mark";
import { X } from "lucide-react";
import { PrefetchNavLink } from "@/components/shared/prefetch-link";
import { navigationSections } from "@/config/navigation";
import { cn } from "@/lib/cn";
import { useAuthStore } from "@/stores/auth-store";

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppSidebar({ isOpen, onClose }: AppSidebarProps) {
  const user = useAuthStore((state) => state.user);
  const activeRole = user?.role ?? "sales_rep";
  const initials =
    user?.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "?";

  return (
    <>
      {isOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          type="button"
        />
      )}
      <aside
        aria-label="Main navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-dvh w-72 shrink-0 flex-col justify-between border-r border-border bg-card/95 p-4 shadow-2xl backdrop-blur-xl transition-transform duration-200 lg:sticky lg:top-0 lg:z-40 lg:h-screen lg:w-64 lg:translate-x-0 lg:bg-card/50 lg:shadow-none",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
          <div className="border-b border-border/70 pb-3">
            <div className="flex items-center justify-between gap-3">
              <LogoMark />
              <button
                aria-label="Close navigation"
                className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-muted hover:text-foreground lg:hidden"
                onClick={onClose}
                type="button"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>
          <nav className="flex flex-col gap-5">
            {navigationSections.map((section) => {
              const visibleItems = section.items.filter((item) => {
                if (!item.roles || item.roles.length === 0) return true;
                return activeRole && item.roles.includes(activeRole);
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
                        onClick={onClose}
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
        <div className="mt-4 border-t border-border/80 pt-3">
          <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card/80 p-3 shadow-xs">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-xs font-bold text-primary">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-foreground">
                {user?.name ?? "Signed out"}
              </p>
              <p className="truncate text-xs text-muted-foreground capitalize">
                {activeRole?.replace("_", " ") ?? ""}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
