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
              Autonomous CPQ & Governance Engine
            </div>
            <h2 className="text-3xl font-bold tracking-tight lg:text-4xl">
              Precision deal engineering for high-velocity enterprises.
            </h2>
            <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
              DealFlow360 unites dynamic product catalogs, algorithmic discount
              ceilings, multi-tier approval routing, and hybrid billing into a
              unified platform.
            </p>
          </div>

          <div className="grid gap-3 pt-4">
            <div className="bg-card/60 flex items-start gap-3 rounded-lg border border-border/60 p-3.5">
              <div className="rounded-md bg-blue-500/10 p-2 text-blue-500">
                <Shield className="size-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-semibold text-foreground">
                  Multi-Tier Approval Routing
                </h4>
                <p className="text-xs text-muted-foreground">
                  Automated Tier 0 pass-through, Manager Tier 1 (&lt;15%), and VP
                  Finance Tier 2 gates.
                </p>
              </div>
            </div>

            <div className="bg-card/60 flex items-start gap-3 rounded-lg border border-border/60 p-3.5">
              <div className="rounded-md bg-emerald-500/10 p-2 text-emerald-500">
                <TrendingUp className="size-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-semibold text-foreground">
                  PS §10 Real-time Risk Engine
                </h4>
                <p className="text-xs text-muted-foreground">
                  Live blended margin calculation, customer tier risk scores, and
                  automated routing badges.
                </p>
              </div>
            </div>

            <div className="bg-card/60 flex items-start gap-3 rounded-lg border border-border/60 p-3.5">
              <div className="rounded-md bg-purple-500/10 p-2 text-purple-500">
                <Users className="size-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-semibold text-foreground">
                  Role-Segregated Workbenches
                </h4>
                <p className="text-xs text-muted-foreground">
                  Tailored operational views for Sales Reps, Sales Managers,
                  Finance Officers, and Admins.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border/60 pt-6 text-xs text-muted-foreground">
          DealFlow360 Enterprise • PS §10 Architectural Benchmark Standard
        </div>
      </Card>

      {/* Right Login / Register Form Container */}
      <div className="flex justify-center">
        <LoginForm />
      </div>
    </main>
  );
}
