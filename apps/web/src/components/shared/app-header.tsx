import { LogOut } from "lucide-react";
import { appMeta } from "@template/shared";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useAuthStore } from "@/stores/auth-store";

export function AppHeader() {
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);

  return (
    <header className="surface-card flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs font-semibold tracking-widest text-primary uppercase">
          {appMeta.name}
        </p>
        <h1 className="text-2xl font-semibold text-foreground">
          Welcome back, {user?.name ?? "builder"}
        </h1>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <ThemeToggle />
        <Button variant="outline" onClick={clearSession} type="button">
          <LogOut className="size-4" />
          <span>Sign out</span>
        </Button>
      </div>
    </header>
  );
}
