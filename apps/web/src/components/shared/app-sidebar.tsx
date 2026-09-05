import { PrefetchNavLink } from "@/components/shared/prefetch-link";
import { privateNavigation } from "@/config/navigation";
import { cn } from "@/lib/cn";
import { LogoMark } from "@/components/shared/logo-mark";

export function AppSidebar() {
  return (
    <aside className="surface-card flex h-fit flex-col gap-6 p-5">
      <LogoMark />
      <nav className="flex flex-col gap-2">
        {privateNavigation.map((item) => (
          <PrefetchNavLink
            key={item.href}
            to={item.href}
            end={item.href === "/app"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg p-3 text-sm font-medium transition-all duration-300",
                isActive
                  ? "border border-primary-light/30 bg-primary/90 text-surface shadow-lg shadow-primary/40"
                  : "text-muted-foreground hover:translate-x-1 hover:bg-white/5 hover:text-foreground dark:hover:bg-white/5",
              )
            }
          >
            <item.icon className="size-4" />
            <span>{item.title}</span>
          </PrefetchNavLink>
        ))}
      </nav>
    </aside>
  );
}
