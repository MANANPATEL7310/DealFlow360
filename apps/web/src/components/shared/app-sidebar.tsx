import { LogoMark } from "@/components/shared/logo-mark";
import { PrefetchNavLink } from "@/components/shared/prefetch-link";
import { navigationSections } from "@/config/navigation";
import { cn } from "@/lib/cn";
import { useAuthStore } from "@/stores/auth-store";

export function AppSidebar() {
  const user = useAuthStore((state) => state.user);
  const activeRole = user?.role;
  const initials =
    user?.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "?";
  return (
    <aside className="bg-card/50 sticky top-0 z-40 flex h-screen w-64 shrink-0 flex-col justify-between border-r border-border p-4 backdrop-blur-xl">
      <div className="flex flex-col gap-6 overflow-y-auto">
        <div className="border-b border-border/70 pb-3">
          <LogoMark />
        </div>
        <nav className="flex flex-col gap-5">
          {navigationSections.map((section) => {
            const visibleItems = section.items.filter(
              (item) =>
                !item.roles?.length ||
                (activeRole && item.roles.includes(activeRole)),
            );
            if (!visibleItems.length) return null;
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
      <div className="mt-auto border-t border-border/80 pt-3">
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
  );
}
