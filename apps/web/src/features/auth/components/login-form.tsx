import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  appRoutes,
  DEMO_PERSONAS,
  internalRoles,
  type UserRole,
} from "@template/shared";
import { ArrowRight, ShieldCheck, Zap } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RegisterForm } from "@/features/auth/components/register-form";
import { useLoginForm } from "@/features/auth/hooks/use-login-form";
import { useAuthStore } from "@/stores/auth-store";

export function LoginForm() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const { form, isPending, onSubmit } = useLoginForm();
  const switchPersona = useAuthStore((state) => state.switchPersona);
  const navigate = useNavigate();

  const handleQuickPersona = (role: UserRole) => {
    switchPersona(role);
    const persona = DEMO_PERSONAS[role];
    toast.success(`Signed in as ${persona.name} (${persona.title})`);
    navigate(appRoutes.dashboard);
  };

  return (
    <Card className="bg-card/90 w-full max-w-lg space-y-6 border-border/80 p-8 shadow-xl backdrop-blur-md">
      {/* Tab Switcher */}
      <div className="bg-muted/60 grid grid-cols-2 rounded-lg border border-border p-1">
        <button
          className={`rounded-md py-1.5 text-xs font-semibold transition-all ${
            mode === "login"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
          type="button"
          onClick={() => setMode("login")}
        >
          Sign In
        </button>
        <button
          className={`rounded-md py-1.5 text-xs font-semibold transition-all ${
            mode === "register"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
          type="button"
          onClick={() => setMode("register")}
        >
          Create Account
        </button>
      </div>

      {mode === "register" ? (
        <RegisterForm onSwitchToLogin={() => setMode("login")} />
      ) : (
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-500">
              <ShieldCheck className="size-4" />
              Role-Based Access Control
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Sign in to DealFlow360
            </h1>
            <p className="text-sm text-muted-foreground">
              Select a demo persona for instant access, or enter your
              credentials.
            </p>
          </div>

          {/* Quick Demo Persona Bar */}
          <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <Zap className="size-3.5" />
              1-Click Demo Personas
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {internalRoles.map((role) => {
                const persona = DEMO_PERSONAS[role];
                return (
                  <button
                    key={role}
                    className="hover:bg-muted/80 flex flex-col items-start rounded-lg border border-border/80 bg-background/80 p-2.5 text-left transition-all hover:border-primary/50"
                    type="button"
                    onClick={() => handleQuickPersona(role)}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="text-xs font-semibold text-foreground capitalize">
                        {role.replace("_", " ")}
                      </span>
                      <span className="rounded px-1 text-xs font-bold text-muted-foreground uppercase">
                        {persona.avatarInitials}
                      </span>
                    </div>
                    <span className="mt-0.5 text-xs text-muted-foreground">
                      {persona.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-1.5">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="email"
              >
                Email
              </label>
              <Input
                id="email"
                placeholder="sales.rep@dealflow360.com"
                type="email"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-rose-500">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="password"
              >
                Password
              </label>
              <Input
                id="password"
                placeholder="••••••••••••"
                type="password"
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="text-xs text-rose-500">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <label className="flex items-center gap-3 text-sm text-muted-foreground">
              <input
                className="size-4 rounded border border-border accent-primary"
                type="checkbox"
                {...form.register("rememberMe")}
              />
              Keep me signed in on this device
            </label>

            <Button className="w-full" disabled={isPending} type="submit">
              <span>{isPending ? "Signing in..." : "Enter Workspace"}</span>
              <ArrowRight className="size-4" />
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Want to inspect the public landing flow?{" "}
            <Link
              className="font-medium text-primary hover:underline"
              to={appRoutes.home}
            >
              Return home
            </Link>
          </p>
        </div>
      )}
    </Card>
  );
}
