import { Outlet } from "react-router";
import { AppHeader } from "@/components/shared/app-header";
import { AppSidebar } from "@/components/shared/app-sidebar";

export function AppLayout() {
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground antialiased">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
