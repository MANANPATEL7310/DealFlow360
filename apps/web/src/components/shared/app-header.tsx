import { LogOut } from "lucide-react";
import { appMeta } from "@template/shared";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useAuthStore } from "@/stores/auth-store";
import { AiCopilotTrigger } from "@/features/ai";

export function AppHeader() {
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-md md:px-8">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold tracking-wider text-primary uppercase">
            {appMeta.name}
          </span>
          <span className="font-mono text-xs text-muted-foreground/40">/</span>
          <span className="text-xs font-medium text-muted-foreground">
            Operations Workspace
          </span>
        </div>
        <span className="hidden items-center gap-1.5 rounded-full border border-secondary/30 bg-secondary/10 px-2.5 py-0.5 text-xs font-semibold text-secondary sm:inline-flex">
          <span className="size-1.5 animate-pulse rounded-full bg-secondary" />
          Live Governance
        </span>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <div className="bg-muted/40 hidden items-center gap-2 rounded-lg border border-border/80 px-3 py-1 text-xs sm:flex">
            <span className="size-2 rounded-full bg-primary" />
            <span className="font-semibold text-foreground">{user.name}</span>
            <span className="text-muted-foreground capitalize">
              ({user.role.replace("_", " ")})
            </span>
          </div>
        )}
        <AiCopilotTrigger />
        <ThemeToggle />
        <Button
          variant="outline"
          size="sm"
          onClick={clearSession}
          type="button"
          className="gap-2 text-xs"
        >
          <LogOut className="size-3.5" />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
      </div>
    </header>
  );
}
