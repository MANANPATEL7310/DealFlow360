import { Shield, Sparkles, TrendingUp, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LogoMark } from "@/components/shared/logo-mark";
import { LoginForm } from "@/features/auth/components/login-form";

export function LoginPage() {
  return (
    <main className="app-shell grid min-h-screen gap-8 p-4 lg:grid-cols-2 lg:items-center lg:p-12">
      {/* Left Value Proposition Showcase */}
      <Card className="via-card hidden min-h-160 flex-col justify-between border-border/80 bg-linear-to-br from-primary/15 to-background p-10 text-foreground lg:flex">
        <div className="space-y-6">
          <LogoMark />
          <div className="space-y-3 pt-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" />
              Quote-to-cash, without the bottlenecks
            </div>
            <h2 className="text-3xl font-bold tracking-tight lg:text-4xl">
              From complex quotes to cash, with guardrails built in.
            </h2>
            <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
              DealFlow360 brings product catalogs, discount checks, approval
              routing, and hybrid billing together in one platform.
            </p>
          </div>

          <div className="grid gap-3 pt-4">
            <div className="bg-card/60 flex items-start gap-3 rounded-lg border border-border/60 p-3.5">
              <div className="rounded-md bg-blue-500/10 p-2 text-blue-500">
                <Shield className="size-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-semibold text-foreground">
                  Multi-tier approval routing
                </h4>
                <p className="text-xs text-muted-foreground">
                  Low-risk quotes pass through automatically; bigger discounts
                  route to managers, then finance.
                </p>
              </div>
            </div>

            <div className="bg-card/60 flex items-start gap-3 rounded-lg border border-border/60 p-3.5">
              <div className="rounded-md bg-emerald-500/10 p-2 text-emerald-500">
                <TrendingUp className="size-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-semibold text-foreground">
                  Real-time risk checks
                </h4>
                <p className="text-xs text-muted-foreground">
                  Live margin calculation, customer tier risk scores, and
                  automatic routing.
                </p>
              </div>
            </div>

            <div className="bg-card/60 flex items-start gap-3 rounded-lg border border-border/60 p-3.5">
              <div className="rounded-md bg-purple-500/10 p-2 text-purple-500">
                <Users className="size-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-semibold text-foreground">
                  Views tailored to your role
                </h4>
                <p className="text-xs text-muted-foreground">
                  Focused workspaces for sales reps, managers, finance, and
                  admins.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border/60 pt-6 text-xs text-muted-foreground">
          DealFlow360 • Quote-to-cash for B2B sales teams
        </div>
      </Card>

      {/* Right Login / Register Form Container */}
      <div className="flex justify-center">
        <LoginForm />
      </div>
    </main>
  );
}
