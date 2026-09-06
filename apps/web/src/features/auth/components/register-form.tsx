import { type UserRole, internalRoles } from "@template/shared";

import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRegisterForm } from "@/features/auth/hooks/use-register-form";

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const { form, isPending, onSubmit } = useRegisterForm();
  const selectedRole = form.watch("role") as UserRole;

  const handleFillSample = () => {
    const randomId = Math.floor(1000 + Math.random() * 9000);
    form.setValue("name", `Demo User ${randomId}`);
    form.setValue("email", `demo.user.${randomId}@dealflow360.dev`);
    form.setValue("password", "password123");
    form.clearErrors();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <ShieldCheck className="size-4" />
          Create your account
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Create platform account
        </h2>
        <p className="text-sm text-muted-foreground">
          Set up your DealFlow360 account and pick the role that fits you.
        </p>
      </div>

      <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-400">
        <span className="font-semibold">Looking for demo accounts?</span>{" "}
        Ready-to-use demo accounts already exist.{" "}
        <button
          className="font-bold underline hover:text-blue-300"
          type="button"
          onClick={onSwitchToLogin}
        >
          Switch to Sign In
        </button>{" "}
        for 1-click access, or{" "}
        <button
          className="font-bold underline hover:text-blue-300"
          type="button"
          onClick={handleFillSample}
        >
          Auto-fill test details
        </button>{" "}
        to register a new account.
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="name">
            Full Name
          </label>
          <Input
            id="name"
            placeholder="Sarah Chen"
            type="text"
            {...form.register("name")}
          />
          {form.formState.errors.name && (
            <p className="text-xs text-rose-500">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            className="text-sm font-medium text-foreground"
            htmlFor="register-email"
          >
            Corporate Email
          </label>
          <Input
            id="register-email"
            placeholder="sarah.chen@dealflow360.com"
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
            htmlFor="register-password"
          >
            Password
          </label>
          <Input
            id="register-password"
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

        <div className="space-y-2 pt-2">
          <label className="text-sm font-medium text-foreground">
            Platform Role & Authority
          </label>
          <div className="grid grid-cols-2 gap-2">
            {internalRoles.map((role) => {
              const isSelected = selectedRole === role;
              return (
                <button
                  key={role}
                  className={`flex flex-col items-start rounded-lg border p-3 text-left transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-xs"
                      : "bg-card/50 hover:bg-muted/50 border-border hover:border-primary/40"
                  }`}
                  type="button"
                  onClick={() => form.setValue("role", role)}
                >
                  <span className="text-xs font-semibold text-foreground capitalize">
                    {role.replace("_", " ")}
                  </span>
                  <span className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    Assign this account to the {role.replace("_", " ")}{" "}
                    workspace.
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <Button className="w-full" disabled={isPending} type="submit">
          <span>
            {isPending ? "Provisioning account..." : "Complete Registration"}
          </span>
          <ArrowRight className="size-4" />
        </Button>
      </form>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <button
            className="font-medium text-primary hover:underline"
            type="button"
            onClick={onSwitchToLogin}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
