import { lazy, Suspense, useState } from "react";
import { Outlet } from "react-router";
import { AppHeader } from "@/components/shared/app-header";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { Spinner } from "@/components/ui/spinner";
import { useAiCopilotStore } from "@/features/ai/stores/ai-copilot-store";

const CopilotDrawer = lazy(() =>
  import("@/features/ai/components/copilot-drawer").then(
    ({ CopilotDrawer: Drawer }) => ({ default: Drawer }),
  ),
);

export function AppLayout() {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const isCopilotOpen = useAiCopilotStore((state) => state.isOpen);

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground antialiased">
      <AppSidebar
        isOpen={isNavigationOpen}
        onClose={() => setIsNavigationOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader onOpenNavigation={() => setIsNavigationOpen(true)} />
        <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 p-4 sm:p-6 md:p-8">
          <Outlet />
        </main>
      </div>
      {isCopilotOpen && (
        <Suspense
          fallback={
            <div
              aria-live="polite"
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-xs"
              role="status"
            >
              <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-muted-foreground shadow-xl">
                <Spinner size="sm" /> Loading AI Copilot…
              </div>
            </div>
          }
        >
          <CopilotDrawer />
        </Suspense>
      )}
    </div>
  );
}
