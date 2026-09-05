import { AppLayout } from "@/components/shared/app-layout";
import { ProtectedRoute } from "@/features/auth/routes/protected-route";

export default function AppLayoutRoute() {
  return (
    <ProtectedRoute>
      <AppLayout />
    </ProtectedRoute>
  );
}
