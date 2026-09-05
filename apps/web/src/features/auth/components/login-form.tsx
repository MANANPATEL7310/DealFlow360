import { Link } from "react-router";
import { appMeta, appRoutes } from "@template/shared";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLoginForm } from "@/features/auth/hooks/use-login-form";

export function LoginForm() {
  const { form, isPending, onSubmit } = useLoginForm();

  return (
    <Card className="w-full max-w-md space-y-6 p-8">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-success/15 bg-success-light/20 px-3 py-1 text-xs font-medium text-success-dark">
          <ShieldCheck className="size-4" />
          Auth-ready token flow
        </div>
        <div>
          <h1 className="text-3xl font-semibold text-foreground">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {appMeta.name} ships with React Hook Form, Zod validation, Zustand
            session state, and Axios interceptors already connected.
          </p>
        </div>
      </div>

      <form className="space-y-5" onSubmit={onSubmit}>
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-foreground"
            htmlFor="email"
          >
            Email
          </label>
          <Input
            id="email"
            placeholder="admin@example.com"
            type="email"
            {...form.register("email")}
          />
          <p className="text-xs text-danger">
            {form.formState.errors.email?.message}
          </p>
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-medium text-foreground"
            htmlFor="password"
          >
            Password
          </label>
          <Input
            id="password"
            placeholder="changeme123"
            type="password"
            {...form.register("password")}
          />
          <p className="text-xs text-danger">
            {form.formState.errors.password?.message}
          </p>
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
          <span>{isPending ? "Signing in..." : "Enter workspace"}</span>
          <ArrowRight className="size-4" />
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        Want to inspect the public flow first?{" "}
        <Link
          className="font-medium text-primary hover:text-primary-dark"
          to={appRoutes.home}
        >
          Return home
        </Link>
      </p>
    </Card>
  );
}
