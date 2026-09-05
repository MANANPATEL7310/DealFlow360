import { useState } from "react";
import { Link } from "react-router";
import { appRoutes } from "@template/shared";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RegisterForm } from "@/features/auth/components/register-form";
import { useLoginForm } from "@/features/auth/hooks/use-login-form";

export function LoginForm() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const { form, isPending, onSubmit } = useLoginForm();

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
              Enter your assigned account credentials to access your workspace.
            </p>
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
