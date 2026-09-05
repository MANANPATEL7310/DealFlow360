import { Link } from "react-router";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { appRoutes } from "@template/shared";
import { Button } from "@/components/ui/button";

export function LandingCta() {
  return (
    <section className="relative overflow-hidden py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-surface to-secondary/10 p-8 text-center shadow-2xl backdrop-blur-xl sm:p-14">
          {/* Subtle decorative glow */}
          <div className="pointer-events-none absolute -top-24 -left-24 size-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 -bottom-24 size-72 rounded-full bg-secondary/20 blur-3xl" />

          <div className="relative z-10 mx-auto max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" />
              <span>Full Quotation-to-Cash Compliance</span>
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Eliminate Margin Leakage and Accelerate Deal Velocity
            </h2>

            <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Step into the self-governing sales operations platform that harmonizes complex pricing,
              approval routing, fulfillment splitting, and hybrid invoicing.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link to={appRoutes.app}>
                <Button size="lg" className="gap-2.5 px-8 font-bold shadow-xl shadow-primary/25">
                  Launch DealFlow360 Workspace
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link to={appRoutes.login}>
                <Button variant="outline" size="lg" className="px-7">
                  Sign In to Your Account
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 border-t border-border/60 pt-8 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-secondary" />
                No Spreadsheet Formulas
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-secondary" />
                Deterministic Risk Governance
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-secondary" />
                Immutable Audit Logging
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
