import { PrefetchNavLink } from "@/components/shared/prefetch-link";
import { navigationSections, type RoleType } from "@/config/navigation";
import { cn } from "@/lib/cn";
import { LogoMark } from "@/components/shared/logo-mark";
import { useAuthStore } from "@/stores/auth-store";

export function AppSidebar() {
  const user = useAuthStore((s) => s.user);
  const userRole = user?.role as RoleType | undefined;

  return (
    <aside className="surface-card flex h-fit flex-col gap-6 p-5">
      <LogoMark />
      <nav className="flex flex-col gap-5">
        {navigationSections.map((section) => {
          // Filter items based on user role if roles are specified
          const visibleItems = section.items.filter((item) => {
            if (!item.roles || item.roles.length === 0) return true;
            if (!userRole) return true; // Show all if role is not yet determined
            return item.roles.includes(userRole);
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
    </aside>
  );
}
