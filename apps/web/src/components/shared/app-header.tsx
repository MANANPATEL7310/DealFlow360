import { LogOut, Menu } from "lucide-react";
import { appMeta } from "@template/shared";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useAuthStore } from "@/stores/auth-store";
import { AiCopilotTrigger } from "@/features/ai";

interface AppHeaderProps {
  onOpenNavigation: () => void;
}

export function AppHeader({ onOpenNavigation }: AppHeaderProps) {
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6 md:px-8">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <Button
          aria-label="Open navigation"
          className="size-9 shrink-0 p-0 lg:hidden"
          onClick={onOpenNavigation}
          size="sm"
          type="button"
          variant="ghost"
        >
          <Menu className="size-5" />
        </Button>
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-bold tracking-tight text-foreground">
            {appMeta.name}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
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
          className="gap-2 px-2.5 text-xs sm:px-3"
        >
          <LogOut className="size-3.5" />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
      </div>
    </header>
  );
}
