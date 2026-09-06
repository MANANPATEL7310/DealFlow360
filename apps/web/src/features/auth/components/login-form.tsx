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
              Welcome back
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Sign in to DealFlow360
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your email and password to access your account.
            </p>
          </div>

          <div className="space-y-2.5 rounded-lg border border-border/80 bg-muted/30 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Demo Accounts (1-Click Fill)
              </span>
              <span className="text-xs text-muted-foreground">
                Password: password123
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  label: "Admin",
                  email: "admin@dealflow360.dev",
                  badge: "Full Access",
                },
                {
                  label: "Sales Rep",
                  email: "sales_rep@dealflow360.dev",
                  badge: "CPQ & Deals",
                },
                {
                  label: "Sales Mgr",
                  email: "sales_manager@dealflow360.dev",
                  badge: "Approvals",
                },
                {
                  label: "Finance",
                  email: "finance@dealflow360.dev",
                  badge: "Invoices",
                },
              ].map((demo) => {
                const currentEmail = form.watch("email");
                const isActive = currentEmail === demo.email;
                return (
                  <button
                    key={demo.email}
                    className={`flex flex-col items-start rounded-md border p-2 text-left transition-all ${
                      isActive
                        ? "border-primary bg-primary/10 shadow-xs"
                        : "border-border/60 bg-background/80 hover:bg-muted/60 hover:border-primary/40"
                    }`}
                    type="button"
                    onClick={() => {
                      form.setValue("email", demo.email);
                      form.setValue("password", "password123");
                    }}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">
                        {demo.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {demo.badge}
                      </span>
                    </div>
                    <span className="mt-0.5 truncate text-xs text-muted-foreground">
                      {demo.email}
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
              <span>{isPending ? "Signing in..." : "Sign in"}</span>
              <ArrowRight className="size-4" />
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Just looking around?{" "}
            <Link
              className="font-medium text-primary hover:underline"
              to={appRoutes.home}
            >
              Back to home
            </Link>
          </p>
        </div>
      )}
    </Card>
  );
}
