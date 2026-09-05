import { useState } from "react";
import { UserCheck, Shield, DollarSign, Settings, Globe, CheckCircle2 } from "lucide-react";

export function RolePersonasSection() {
  const [selectedRole, setSelectedRole] = useState(0);

  const personas = [
    {
      id: "sales_rep",
      name: "Sales Representative",
      icon: UserCheck,
      tagline: "Build compliant quotes in minutes without approval delays",
      badge: "Deal Maker",
      responsibilities: [
        "Rapid multi-line quotation builder with live pricing catalog",
        "Instant margin visibility before submitting to the client",
        "Real-time upsell and cross-sell recommendation side panel",
        "Direct visibility into approval chains and client negotiation status",
      ],
      quote:
        "“I know the exact margin and whether my discount needs approval before I send anything to the client.”",
    },
    {
      id: "sales_manager",
      name: "Sales Manager",
      icon: Shield,
      tagline: "Total visibility and one-click discount governance",
      badge: "Tier 1 Approver",
      responsibilities: [
        "Severity-ranked approval inbox with complete blended-risk breakdown",
        "One-click decision modal: Approve, Reject, or Return for Revision",
        "Deal Health radar detecting stalled deals and slippage risks",
        "Configure regional discount tolerances and team pricing guardrails",
      ],
      quote:
        "“No more guessing if a 12% discount hurts our quarterly gross margin. The risk engine explains the math.”",
    },
    {
      id: "finance",
      name: "Finance & Operations",
      icon: DollarSign,
      tagline: "Unified revenue recognition, credit notes, and fulfillment",
      badge: "Tier 2 Signoff",
      responsibilities: [
        "Second-level approval routing for high-risk and high-value orders",
        "Automated hybrid billing: one-time hardware + recurring subscriptions",
        "Proration management, credit notes, and payment reconciliation",
        "Multi-warehouse split allocation and consolidated backorders",
      ],
      quote:
        "“Hardware orders and cloud licenses finally bill together cleanly on a single unified invoice schedule.”",
    },
    {
      id: "customer",
      name: "Customer / Buyer",
      icon: Globe,
      tagline: "Transparent, scoped negotiation portal",
      badge: "Restricted Portal",
      responsibilities: [
        "Secure magic-link authenticated view restricted to specific quotation",
        "Interactive line-by-line inspection and counter-proposal submission",
        "Immediate contract acceptance and terms confirmation",
        "Zero access to internal costs, margins, or backend tooling",
      ],
      quote:
        "“Reviewing terms and requesting revisions is clear, fast, and transparent right in the portal.”",
    },
    {
      id: "admin",
      name: "Platform Administrator",
      icon: Settings,
      tagline: "Complete system configuration and compliance audit trail",
      badge: "System Operator",
      responsibilities: [
        "Product catalog, variant configuration, and price list assignment",
        "Customer tier ceilings and category discount caps matrix",
        "Warehouse logistics setup and inventory replenish thresholds",
        "Full immutable audit trail with actor IDs, timestamps, and JSON diffs",
      ],
      quote:
        "“Every single price update, approval decision, and system setting change is logged and fully traceable.”",
    },
  ];

  const current = personas[selectedRole] ?? personas[0]!;
  const Icon = current.icon;

  return (
    <section id="roles" className="border-t border-border/60 bg-surface/30 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
            <span>Tailored Role Experiences</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Designed for Every Stakeholder
          </h2>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            DealFlow360 provides specialized workspaces with strict role-based access control (RBAC),
            ensuring each role operates at peak efficiency.
          </p>
        </div>

        {/* Role Selectors */}
        <div className="mb-10 flex flex-wrap justify-center gap-2">
          {personas.map((p, idx) => {
            const PIcon = p.icon;
            const active = idx === selectedRole;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedRole(idx)}
                className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                  active
                    ? "border-primary bg-primary text-white shadow-md shadow-primary/25"
                    : "border-border bg-surface text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                }`}
              >
                <PIcon className="size-4" />
                <span>{p.name}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Persona Card */}
        <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-surface p-7 shadow-xl backdrop-blur-md sm:p-10">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
            <div className="flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="size-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-foreground">{current.name}</h3>
                  <span className="rounded-full border border-secondary/30 bg-secondary/15 px-2.5 py-0.5 text-xs font-bold text-secondary">
                    {current.badge}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{current.tagline}</p>
              </div>
            </div>
          </div>

          <div className="grid items-center gap-8 md:grid-cols-2">
            <div className="space-y-3">
              <p className="text-xs font-bold tracking-wider text-foreground uppercase">
                Core Capabilities &amp; Access:
              </p>
              <div className="space-y-2.5">
                {current.responsibilities.map((resp, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" />
                    <span>{resp}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-center rounded-xl border border-border bg-surface-muted/60 p-6">
              <p className="text-sm leading-relaxed text-foreground italic">{current.quote}</p>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                <span>Access Security:</span>
                <span className="font-mono font-semibold text-primary">RBAC Enforced</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
