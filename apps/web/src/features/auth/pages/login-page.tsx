import { Card } from "@/components/ui/card";
import { LogoMark } from "@/components/shared/logo-mark";
import { LoginForm } from "@/features/auth/components/login-form";

export function LoginPage() {
  return (
    <main className="app-shell grid min-h-screen gap-6 lg:grid-cols-2 lg:items-center">
      <Card className="hidden min-h-140 justify-between bg-primary p-8 text-surface lg:flex">
        <LogoMark className="[&_p:first-child]:text-surface/70 [&_p:last-child]:text-surface" />
        <div className="space-y-5">
          <p className="text-sm font-semibold tracking-widest text-surface/80 uppercase">
            Frontend-first monorepo foundation
          </p>
          <h2 className="text-4xl leading-tight font-semibold">
            Start from a real product shell, not a blank React starter.
          </h2>
          <p className="max-w-xl text-base leading-7 text-surface/80">
            Routing, design tokens, forms, auth state, and API wiring are all in
            place so new features can start on day one.
          </p>
        </div>
      </Card>
      <div className="flex justify-center">
        <LoginForm />
      </div>
    </main>
  );
}
