import { Outlet } from "react-router";
import { AppHeader } from "@/components/shared/app-header";
import { AppSidebar } from "@/components/shared/app-sidebar";

export function AppLayout() {
  return (
    <main className="app-shell sidebar-layout">
      <AppSidebar />
      <div className="space-y-6">
        <AppHeader />
        <Outlet />
      </div>
    </main>
  );
}
